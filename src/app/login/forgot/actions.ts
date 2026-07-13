"use server";

import { redirect } from "next/navigation";
import { createSupabaseEmailLinkClient } from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/auth/origin";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/login/forgot?error=${encodeURIComponent("Email required")}`);
  }

  // Implicit flow, same reason as the magic link: a reset link opened on a
  // different device than it was requested from must still work.
  const supabase = await createSupabaseEmailLinkClient();
  const origin = await resolveOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    redirect(`/login/forgot?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login/forgot?sent=1");
}
