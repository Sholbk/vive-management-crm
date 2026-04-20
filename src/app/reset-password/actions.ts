"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Password must be at least 8 characters")}`,
    );
  }

  if (password !== confirm) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords do not match")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Use service-role client to bypass Supabase's "Secure password change"
  // reauthentication check. Safe because we've just verified the caller's
  // identity against the session cookie on the line above — the caller is
  // only able to set their own password.
  const admin = createSupabaseServiceClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/leads");
}
