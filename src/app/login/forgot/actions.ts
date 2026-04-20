"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function resolveOrigin(): Promise<string> {
  const envOrigin = process.env.NEXT_PUBLIC_CRM_URL?.trim();
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "";
}

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
