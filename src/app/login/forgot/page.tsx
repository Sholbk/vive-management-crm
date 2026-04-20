import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Reset password</h1>
        {params.sent === "1" ? (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-text-muted">
              If an account exists for that email, you&apos;ll receive a link to
              reset your password shortly.
            </p>
            <a
              href="/login"
              className="text-sm text-brand-accent hover:underline"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4">
              Enter your account email and we&apos;ll send you a link to set a
              new password.
            </p>
            <form action={requestPasswordReset} className="space-y-3">
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
              {params.error && (
                <p className="text-sm text-red-600">{params.error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-brand text-white rounded py-2 text-sm font-medium hover:opacity-90"
              >
                Send reset link
              </button>
              <a
                href="/login"
                className="block text-center text-xs text-text-muted hover:text-text"
              >
                Back to sign in
              </a>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
