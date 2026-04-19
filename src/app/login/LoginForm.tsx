import { use } from "react";
import { signInWithPassword, sendMagicLink } from "./actions";

export default function LoginForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{
    next?: string;
    sent?: string;
    error?: string;
    mode?: string;
  }>;
}) {
  const searchParams = use(searchParamsPromise);
  const mode = searchParams.mode === "magic" ? "magic" : "password";

  if (searchParams.sent === "1") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-muted">
          Check your email for the sign-in link.
        </p>
        <a
          href="/login"
          className="text-sm text-brand-accent hover:underline"
        >
          Back to password sign-in
        </a>
      </div>
    );
  }

  if (mode === "magic") {
    return (
      <form action={sendMagicLink} className="space-y-3">
        <label className="block text-sm">
          <span className="text-text-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
            autoComplete="email"
          />
        </label>
        {searchParams.next && (
          <input type="hidden" name="next" value={searchParams.next} />
        )}
        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}
        <button
          type="submit"
          className="w-full bg-brand text-white rounded py-2 text-sm font-medium hover:opacity-90"
        >
          Send magic link
        </button>
        <a
          href={
            searchParams.next
              ? `/login?next=${encodeURIComponent(searchParams.next)}`
              : "/login"
          }
          className="block text-center text-xs text-text-muted hover:text-text"
        >
          Back to password sign-in
        </a>
      </form>
    );
  }

  return (
    <form action={signInWithPassword} className="space-y-3">
      <label className="block text-sm">
        <span className="text-text-muted">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
          autoComplete="email"
        />
      </label>
      <label className="block text-sm">
        <span className="text-text-muted">Password</span>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
          autoComplete="current-password"
        />
      </label>
      {searchParams.next && (
        <input type="hidden" name="next" value={searchParams.next} />
      )}
      {searchParams.error && (
        <p className="text-sm text-red-600">{searchParams.error}</p>
      )}
      <button
        type="submit"
        className="w-full bg-brand text-white rounded py-2 text-sm font-medium hover:opacity-90"
      >
        Sign in
      </button>
      <a
        href={
          searchParams.next
            ? `/login?mode=magic&next=${encodeURIComponent(searchParams.next)}`
            : "/login?mode=magic"
        }
        className="block text-center text-xs text-text-muted hover:text-text"
      >
        Email me a sign-in link instead
      </a>
    </form>
  );
}
