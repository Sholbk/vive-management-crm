import { use } from "react";
import { signInWithPassword } from "./actions";

export default function LoginForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{
    next?: string;
    error?: string;
  }>;
}) {
  const searchParams = use(searchParamsPromise);

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
        href="/login/forgot"
        className="block text-center text-xs text-text-muted hover:text-text"
      >
        Forgot password?
      </a>
    </form>
  );
}
