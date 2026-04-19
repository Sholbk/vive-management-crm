"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STAGES } from "@/app/leads/types";

export async function renameStage(formData: FormData) {
  const stageKey = formData.get("stage_key") as string;
  const displayName = ((formData.get("display_name") as string) || "").trim();

  if (!(STAGES as readonly string[]).includes(stageKey)) {
    throw new Error("Invalid stage key");
  }
  if (!displayName) throw new Error("Display name is required");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("stage_labels")
    .update({ display_name: displayName })
    .eq("stage_key", stageKey);

  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/reports");
  revalidatePath("/settings");
}

const ALLOWED_ROLES = [
  "admin",
  "sales_agent",
  "property_manager",
  "marketing",
] as const;

export async function updateTeamMember(profileId: string, formData: FormData) {
  const role = (formData.get("role") as string) || "sales_agent";
  const active = formData.get("active") === "on";
  const fullName = ((formData.get("full_name") as string) || "").trim() || null;

  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) {
    throw new Error("Invalid role");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, active, full_name: fullName })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/leads");
}
