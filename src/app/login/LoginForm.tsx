"use client";

import { useState } from "react";
import { sendMagicLink, signInWithPassword } from "./actions";

type Mode = "magic" | "password";

export default function LoginForm({
  next,
  error,
  sent,
  initialMode,
}: {
  next?: string;
  error?: string;
  sent?: string;
  initialMode: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  // After a link is sent the form is replaced entirely — re-showing the email
  // field invites people to submit again and invalidate the link they just got.
  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-1">
            Check your email
          </h2>
          <p className="text-sm text-text-muted">
            If an account exists for{" "}
            <span className="font-medium text-text">{sent}</span>, we&apos;ve
            sent it a sign-in link. It expires shortly, so use the newest one.
          </p>
        </div>
        <a
          href="/login"
          className="block text-center text-xs text-text-muted hover:text-text"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full border border-border rounded px-3 py-2 text-sm";
  const buttonClass =
    "w-full bg-brand text-white rounded py-2 text-sm font-medium hover:opacity-90";

  return (
    <div className="space-y-4">
      {mode === "magic" ? (
        <form action={sendMagicLink} className="space-y-3">
          <label className="block text-sm">
            <span className="text-text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
          {next && <input type="hidden" name="next" value={next} />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className={buttonClass}>
            Email me a sign-in link
          </button>
          <p className="text-xs text-text-muted text-center">
            No password needed — we&apos;ll email you a link that signs you in.
          </p>
        </form>
      ) : (
        <form action={signInWithPassword} className="space-y-3">
          <label className="block text-sm">
            <span className="text-text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </label>
          {next && <input type="hidden" name="next" value={next} />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className={buttonClass}>
            Sign in
          </button>
          <a
            href="/login/forgot"
            className="block text-center text-xs text-text-muted hover:text-text"
          >
            Forgot password?
          </a>
        </form>
      )}

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setMode(mode === "magic" ? "password" : "magic")}
          className="w-full text-center text-xs text-text-muted hover:text-text underline"
        >
          {mode === "magic"
            ? "Sign in with a password instead"
            : "Email me a sign-in link instead"}
        </button>
      </div>
    </div>
  );
}
