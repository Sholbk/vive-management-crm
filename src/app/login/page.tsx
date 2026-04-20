import Link from "next/link";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <header className="max-w-5xl w-full mx-auto px-6 py-4">
        <Link href="/">
          <Logo size={40} />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <Logo size={56} />
          </div>
          <div className="border border-border bg-white rounded-xl p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-text mb-1">
              Sign in to the CRM
            </h1>
            <p className="text-sm text-text-muted mb-5">
              Manage leads from every Vive Real Estate development in one
              place.
            </p>
            <LoginForm searchParamsPromise={searchParams} />
          </div>
          <p className="text-xs text-text-muted text-center mt-6">
            By signing in you agree to our{" "}
            <Link href="/terms" className="underline hover:text-text">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-text">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
