import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Vive Real Estate CRM",
  description:
    "How Vive Real Estate and Dragonfly Web Designs collect, store, and use data in the Vive Real Estate CRM.",
};

const LAST_UPDATED = "April 20, 2026";

export default function PrivacyPage() {
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

      <article className="max-w-3xl mx-auto px-6 pb-16 prose prose-sm">
        <h1 className="text-3xl font-semibold text-text">Privacy Policy</h1>
        <p className="text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>

        <h2 className="text-xl font-semibold mt-8 text-text">1. Who we are</h2>
        <p className="text-text-muted">
          The Vive Real Estate CRM (the &ldquo;Service&rdquo;) is operated by
          Dragonfly Web Designs on behalf of Vive Real Estate, a real-estate
          and property-management company based in San Carlos, Mexico. If you
          have questions about this policy, contact{" "}
          <a href="mailto:sbholbk@gmail.com" className="text-brand underline">
            sbholbk@gmail.com
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          2. Who this policy applies to
        </h2>
        <p className="text-text-muted">
          The Service is an internal tool used by authorized Vive Real Estate
          staff (&ldquo;Users&rdquo;) to manage inquiries submitted through
          Vive Real Estate marketing websites (&ldquo;Leads&rdquo;). This
          policy describes how we handle personal information for both Users
          and Leads.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          3. Information we collect
        </h2>
        <p className="text-text-muted font-medium mt-4">For Users:</p>
        <ul className="text-text-muted list-disc pl-6">
          <li>Email address, name, and Google profile picture (if signed in with Google).</li>
          <li>Authentication metadata (last sign-in timestamp, session cookies).</li>
          <li>Activity within the CRM (pages viewed, notes added, lead-stage changes).</li>
        </ul>
        <p className="text-text-muted font-medium mt-4">For Leads:</p>
        <ul className="text-text-muted list-disc pl-6">
          <li>
            Name, email, phone number, preferred budget, source development, and
            any message the lead voluntarily submits via a Vive Real Estate
            marketing site.
          </li>
          <li>Notes, activity, and status assigned by Vive Real Estate staff.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 text-text">
          4. How we use Google account information
        </h2>
        <p className="text-text-muted">
          When a User signs in with Google, we request the standard{" "}
          <code>openid</code>, <code>email</code>, and <code>profile</code>{" "}
          scopes. We use that information solely to authenticate the User, to
          display their name in the CRM, and to associate their actions with
          their account. We do not sell, share, or use Google user data for
          advertising, and we do not access any Google service beyond what is
          needed to sign the user in.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          5. Where data is stored
        </h2>
        <p className="text-text-muted">
          User and Lead data is stored in a Supabase Postgres database hosted
          in the United States. Authentication is handled by Supabase Auth.
          The Service is deployed on Netlify.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          6. Who can see the data
        </h2>
        <p className="text-text-muted">
          Access to Lead data inside the CRM is governed by row-level security:
          administrators see all Leads; sales agents see only Leads assigned to
          them or unassigned Leads from developments they belong to. User
          account data (email, name) is visible to other authenticated Users of
          the same CRM workspace. Data is never sold or disclosed to third
          parties outside of the service providers listed in section 5.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">7. Retention</h2>
        <p className="text-text-muted">
          We retain Lead data for as long as Vive Real Estate considers the
          lead active, or until a deletion request is received. User accounts
          are retained while the User is a staff member of Vive Real Estate or
          Dragonfly Web Designs and deleted shortly after offboarding.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          8. Your rights
        </h2>
        <p className="text-text-muted">
          You can request access, correction, or deletion of any personal
          information we hold about you by emailing{" "}
          <a href="mailto:sbholbk@gmail.com" className="text-brand underline">
            sbholbk@gmail.com
          </a>
          . If you signed in with Google and want to revoke our access, visit
          your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            className="text-brand underline"
            target="_blank"
            rel="noreferrer"
          >
            Google account permissions page
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-6 text-text">
          9. Changes to this policy
        </h2>
        <p className="text-text-muted">
          We may update this policy from time to time. Material changes will be
          communicated in-app or by email to active Users.
        </p>
      </article>

      <footer className="max-w-3xl mx-auto px-6 py-10 border-t border-border text-sm text-text-muted flex justify-between">
        <Link href="/" className="hover:text-text">
          ← Home
        </Link>
        <Link href="/terms" className="hover:text-text">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}
