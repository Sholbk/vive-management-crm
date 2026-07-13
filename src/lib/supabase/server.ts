import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
 * Deliberately uses the IMPLICIT flow rather than @supabase/ssr's PKCE default.
 * Under PKCE the code verifier is written to the *requesting* browser's storage
 * and the emailed link carries only `?code=`, so the link can only be redeemed
 * by the exact browser that asked for it. Request a link on a laptop, open the
 * mail on a phone, and it dies with "PKCE code verifier not found in storage" —
 * which defeats the point of an emailed link. Implicit returns the session in
 * the URL fragment instead, so the link works from any device. /auth/callback
 * already handles that hash delivery.
 *
 * Do NOT use this for password sign-in or for reading a session; it exists only
 * to originate email links.
 */
export async function createSupabaseEmailLinkClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await cookieAdapter(),
      auth: { flowType: "implicit" },
    },
  );
}
