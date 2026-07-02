import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Persists the session in cookies (the
 * @supabase/ssr default), so a session established here is readable by the
 * server client on the next navigation. Used by the auth callback page to
 * complete email-link (recovery / invite / magic-link) sign-in, including the
 * implicit flow where tokens arrive in the URL hash fragment and are therefore
 * invisible to a server route handler.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
