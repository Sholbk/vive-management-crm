"use client";

import { useEffect, useRef, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import Logo from "@/components/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Auth callback for email links (password recovery, invites, magic links).
 *
 * This is a CLIENT page on purpose. Supabase can deliver the session three
 * different ways depending on how the link was generated:
 *   1. Implicit flow  -> tokens in the URL hash  (#access_token=…&refresh_token=…)
 *   2. OTP / token_hash -> ?token_hash=…&type=…
 *   3. PKCE            -> ?code=…
 * A server route handler can only ever see (2) and (3); the hash in (1) is
 * never sent to the server, which is why recovery links were failing with
 * "Missing auth code or token". Handling it in the browser covers all three.
 *
 * Once the browser client establishes the session it is persisted to cookies,
 * so the subsequent full-page navigation to `next` is authenticated on the
 * server (e.g. /reset-password can read the user and let them set a password).
 */
function safeNext(value: string | null): string {
  // Only allow internal, absolute paths to avoid open redirects.
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/leads";
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const query = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const next = safeNext(query.get("next") ?? hash.get("next"));

      const fail = (msg: string) => {
        window.location.replace(`/login?error=${encodeURIComponent(msg)}`);
      };

      // An expired/invalid link reports the reason in the hash.
      const linkError = hash.get("error_description") || hash.get("error");
      if (linkError) {
        fail(linkError.replace(/\+/g, " "));
        return;
      }

      try {
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const tokenHash = query.get("token_hash");
        const type = query.get("type") as EmailOtpType | null;
        const code = query.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          throw new Error(
            "This link is invalid or has expired. Please request a new one.",
          );
        }

        // Session cookies are now set; hand off to the server-rendered target.
        window.location.replace(next);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not complete sign-in. Please request a new link.",
        );
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <Logo size={72} />
        </div>
        <div className="border border-border bg-white rounded-xl p-6 shadow-sm">
          {error ? (
            <>
              <h1 className="text-lg font-semibold text-text mb-2">
                Link problem
              </h1>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <a
                href="/login/forgot"
                className="inline-block bg-brand text-white rounded py-2 px-4 text-sm font-medium hover:opacity-90"
              >
                Request a new link
              </a>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-text mb-1">
                Signing you in…
              </h1>
              <p className="text-sm text-text-muted">One moment.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
