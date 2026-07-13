"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/auth/origin";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/login/forgot?error=${encodeURIComponent("Email required")}`);
  }

  const supabase = await createSupabaseServerClient();
  const origin = await resolveOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    redirect(`/login/forgot?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login/forgot?sent=1");
}
