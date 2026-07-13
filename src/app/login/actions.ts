"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import {
  createSupabaseEmailLinkClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/auth/origin";

const DEFAULT_NEXT = "/leads";

/**
 * Supabase reports "this email has no account" when shouldCreateUser is false.
 * Surfacing that would turn the login form into an account-existence oracle, so
 * these are swallowed and the caller shows the same "check your inbox" state it
 * shows for a real address.
 */
function isUnknownUser(error: AuthError): boolean {
  return (
    error.code === "otp_disabled" ||
    /signups not allowed/i.test(error.message) ||
    /user not found/i.test(error.message)
  );
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? DEFAULT_NEXT);

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Email is required")}`);
  }

  // Implicit flow: the link must be redeemable in whatever browser opens the
  // email, not just the one that requested it.
  const supabase = await createSupabaseEmailLinkClient();
  const origin = await resolveOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // CRM accounts are invite-only. Without this, typing any address into the
      // login box would create an account and email it a working sign-in link.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error && !isUnknownUser(error)) {
    redirect(
      `/login?mode=magic&error=${encodeURIComponent(error.message)}` +
        (next !== DEFAULT_NEXT ? `&next=${encodeURIComponent(next)}` : ""),
    );
  }

  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? DEFAULT_NEXT);

  if (!email || !password) {
    redirect(
      `/login?mode=password&error=${encodeURIComponent("Email and password are required")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Keep the user on the password tab so their choice isn't reset on failure.
    redirect(
      `/login?mode=password&error=${encodeURIComponent(error.message)}` +
        (next !== DEFAULT_NEXT ? `&next=${encodeURIComponent(next)}` : ""),
    );
  }
  redirect(next);
}
