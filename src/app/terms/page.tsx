import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Vive Real Estate CRM",
  description:
    "Terms of Service for authorized Users of the Vive Real Estate CRM.",
};

const LAST_UPDATED = "April 20, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-text">
          Vive Real Estate CRM
        </Link>
        <Link href="/login" className="text-sm text-text-muted hover:text-text">
          Sign in
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-6 pb-16">
        <h1 className="text-3xl font-semibold text-text">Terms of Service</h1>
        <p className="text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>

        <h2 className="text-xl font-semibold mt-8 text-text">
          1. Acceptance of terms
        </h2>
        <p className="text-text-muted">
          By accessing the Vive Real Estate CRM (the &ldquo;Service&rdquo;),
          you agree to these Terms of Service. The Service is operated by
          Dragonfly Web Designs on behalf of Vive Real Estate. If you do not
          agree to these terms, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          2. Authorized use only
        </h2>
        <p className="text-text-muted">
          The Service is an internal business tool. Access is restricted to
          employees, contractors, and authorized agents of Vive Real Estate and
          Dragonfly Web Designs. You may not share your account credentials or
          allow unauthorized individuals to use your account.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          3. Acceptable use
        </h2>
        <p className="text-text-muted">
          You agree to use the Service only for its intended purpose — managing
          Vive Real Estate sales and property-management workflows. You agree
          not to:
        </p>
        <ul className="text-text-muted list-disc pl-6">
          <li>Export lead or user data for purposes unrelated to Vive Real Estate business.</li>
          <li>Attempt to circumvent authentication, authorization, or row-level security.</li>
          <li>Introduce malicious software or disrupt the operation of the Service.</li>
          <li>Use the Service to send unsolicited commercial messages.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 text-text">
          4. Data handling
        </h2>
        <p className="text-text-muted">
          Your handling of personal information about leads and colleagues is
          governed by the{" "}
          <Link href="/privacy" className="text-brand underline">
            Privacy Policy
          </Link>
          . You must comply with applicable data-protection laws when acting on
          behalf of Vive Real Estate.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          5. Account termination
        </h2>
        <p className="text-text-muted">
          We may suspend or terminate your account at any time if you leave
          Vive Real Estate or Dragonfly Web Designs, if you violate these
          terms, or at the request of Vive Real Estate management.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          6. No warranty
        </h2>
        <p className="text-text-muted">
          The Service is provided on an &ldquo;as is&rdquo; basis without
          warranties of any kind. Dragonfly Web Designs and Vive Real Estate
          do not guarantee uninterrupted availability or error-free operation.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          7. Limitation of liability
        </h2>
        <p className="text-text-muted">
          To the fullest extent permitted by law, neither Dragonfly Web Designs
          nor Vive Real Estate will be liable for any indirect, incidental, or
          consequential damages arising out of your use of the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          8. Contact
        </h2>
        <p className="text-text-muted">
          Questions about these terms should be sent to{" "}
          <a href="mailto:sbholbk@gmail.com" className="text-brand underline">
            sbholbk@gmail.com
          </a>
          .
        </p>
      </article>

      <footer className="max-w-3xl mx-auto px-6 py-10 border-t border-border text-sm text-text-muted flex justify-between">
        <Link href="/" className="hover:text-text">
          ← Home
        </Link>
        <Link href="/privacy" className="hover:text-text">
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
