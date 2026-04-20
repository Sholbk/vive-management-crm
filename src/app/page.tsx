import Link from "next/link";

export const metadata = {
  title: "Vive Real Estate CRM",
  description:
    "Internal lead-management platform for Vive Real Estate developments in San Carlos, Mexico.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-text">
          Vive Real Estate CRM
        </span>
        <Link
          href="/login"
          className="text-sm font-medium bg-brand text-white rounded px-4 py-2 hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-semibold text-text leading-tight">
          Lead management for Vive Real Estate developments.
        </h1>
        <p className="mt-6 text-lg text-text-muted">
          This is the internal CRM used by Vive Real Estate and Dragonfly Web
          Designs to manage inquiries from Loma del Mar and forthcoming
          San Carlos housing-development websites. Access is limited to
          authorized Vive Real Estate staff.
        </p>

        <div className="mt-10 flex gap-3">
          <Link
            href="/login"
            className="bg-brand text-white rounded px-5 py-3 text-sm font-medium hover:opacity-90"
          >
            Sign in to the CRM
          </Link>
          <a
            href="https://viverealestate.mx"
            className="border border-border rounded px-5 py-3 text-sm font-medium text-text hover:bg-white"
          >
            Vive Real Estate →
          </a>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-10 border-t border-border text-sm text-text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>
          © {new Date().getFullYear()} Dragonfly Web Designs on behalf of Vive
          Real Estate.
        </span>
        <span className="flex gap-4">
          <Link href="/privacy" className="hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-text">
            Terms
          </Link>
        </span>
      </footer>
    </main>
  );
}
