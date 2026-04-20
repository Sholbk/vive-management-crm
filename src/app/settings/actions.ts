"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { STAGES } from "@/app/leads/types";

function fail(message: string): never {
  redirect(`/settings?error=${encodeURIComponent(message)}`);
}

function done(message: string): never {
  redirect(`/settings?ok=${encodeURIComponent(message)}`);
}

export async function renameStage(formData: FormData) {
  const stageKey = formData.get("stage_key") as string;
  const displayName = ((formData.get("display_name") as string) || "").trim();

  if (!(STAGES as readonly string[]).includes(stageKey)) fail("Invalid stage key");
  if (!displayName) fail("Display name is required");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("stage_labels")
    .update({ display_name: displayName })
    .eq("stage_key", stageKey);

  if (error) fail(error.message);

  revalidatePath("/leads");
  revalidatePath("/reports");
  done(`Renamed “${stageKey}” to “${displayName}”`);
}

const ALLOWED_ROLES = [
  "admin",
  "sales_agent",
  "property_manager",
  "marketing",
] as const;

export async function addTeamMember(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const fullName = ((formData.get("full_name") as string) || "").trim() || null;
  const role = (formData.get("role") as string) || "sales_agent";
  const password = ((formData.get("password") as string) || "").trim();

  if (!email) fail("Email is required");
  if (password.length < 8) fail("Password must be at least 8 characters");
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) fail("Invalid role");

  // Verify the requester is an admin before using the service client.
  const userClient = await createSupabaseServerClient();
  const { data: me } = await userClient.auth.getUser();
  if (!me.user) fail("Not signed in");
  const { data: myProfile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", me.user.id)
    .maybeSingle();
  if (myProfile?.role !== "admin") fail("Only admins can add team members");

  const admin = createSupabaseServiceClient();

  // Create the auth user. email_confirm=true skips the verification email
  // so the person can log in immediately with the credentials the admin
  // hands them.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created.user) {
    fail(createErr?.message || "Failed to create user");
  }

  // The handle_new_user() trigger already inserted a default profile row.
  // Patch it with the name and role the admin chose.
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", created.user!.id);

  if (profileErr) fail(profileErr.message);

  revalidatePath("/leads");
  done(`Added ${email}`);
}

export async function updateTeamMember(profileId: string, formData: FormData) {
  const role = (formData.get("role") as string) || "sales_agent";
  const active = formData.get("active") === "on";
  const fullName = ((formData.get("full_name") as string) || "").trim() || null;

  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) fail("Invalid role");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, active, full_name: fullName })
    .eq("id", profileId);

  if (error) fail(error.message);

  revalidatePath("/leads");
  done("Team member updated");
}
