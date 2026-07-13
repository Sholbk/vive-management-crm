import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

async function cookieAdapter() {
  const cookieStore = await cookies();

  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Called from a Server Component; middleware will refresh the session.
      }
    },
  };
}

export async function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: await cookieAdapter() },
  );
}

/**
 * Client for sending email sign-in links (magic link, password reset).
 *
 * Uses plain supabase-js, NOT @supabase/ssr, and that is the whole point:
 * createServerClient hard-codes `flowType: "pkce"` *after* spreading the caller's
 * auth options, so it silently ignores any attempt to ask for implicit. Under
 * PKCE the code verifier is stored in the browser that REQUESTED the link and
 * the email carries only `?code=`, so the link is redeemable by that browser
 * alone — request it on a laptop, open the mail on a phone, and it dies with
 * "PKCE code verifier not found in storage". That defeats the entire point of
 * an emailed link.
 *
 * Implicit returns the session in the URL fragment instead, so the link works
 * from any device. /auth/callback already handles that hash delivery.
 *
 * No cookies and no session storage: this client only ever originates an email.
 * Do NOT use it for password sign-in or to read a session — it deliberately
 * cannot persist one.
 */
export function createSupabaseEmailLinkClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
