import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">CRM Sign In</h1>
        <LoginForm searchParamsPromise={searchParams} />
      </div>
    </main>
  );
}
