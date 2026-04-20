import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Set a new password</h1>
        <p className="text-sm text-text-muted mb-4">
          Signed in as <strong>{user.email}</strong>. Choose a new password
          below.
        </p>
        <form action={updatePassword} className="space-y-3">
          <label className="block text-sm">
            <span className="text-text-muted">New password</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Confirm new password</span>
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              className="mt-1 w-full border border-border rounded px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </label>
          {params.error && (
            <p className="text-sm text-red-600">{params.error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-brand text-white rounded py-2 text-sm font-medium hover:opacity-90"
          >
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
