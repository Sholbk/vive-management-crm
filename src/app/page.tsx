import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Vive Management CRM — Lead management for San Carlos developments",
  description:
    "Internal CRM used by Vive Real Estate and Dragonfly Web Designs to manage inquiries from Loma del Mar and forthcoming San Carlos housing developments.",
};

const FEATURES = [
  {
    title: "Unified pipeline",
    body: "Every inquiry from Loma del Mar, and the next two San Carlos developments lands in one pipeline you can filter and sort by development, stage, source, or agent.",
  },
  {
    title: "Automatic lead capture",
    body: "Contact forms on each marketing site post directly into the CRM with Zod-validated payloads, dedupe, and CORS allow-listing — no copy-paste.",
  },
  {
    title: "Assign and notify",
    body: "Route new leads to the right agent, trigger SendGrid email, Slack, SMS, and N8N autoresponder sequences the moment a lead arrives.",
  },
  {
    title: "Role-based access",
    body: "Admins see everything; sales agents see only the leads assigned to them or open leads in their development. Enforced at the database level.",
  },
  {
    title: "Activity trail",
    body: "Every stage change, note, and assignment is logged on the lead — so you can hand off a conversation without losing context.",
  },
  {
    title: "Reports & insight",
    body: "Marketing aggregate views strip PII and let you track source, conversion, and pipeline value across developments without exposing lead data.",
  },
];

const DEVELOPMENTS = [
  {
    name: "Loma del Mar",
    status: "Live",
    desc: "San Carlos, Sonora — ocean-view homes and lots currently accepting inquiries.",
    href: "https://loma-del-mar.netlify.app",
  },
  {
    name: "Second development",
    status: "In planning",
    desc: "Second Vive Real Estate community, marketing site in preparation.",
  },
  {
    name: "Third development",
    status: "In planning",
    desc: "Third Vive Real Estate community, marketing site in preparation.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/">
          <Logo size={40} />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="text-text-muted hover:text-text">
            Features
          </a>
          <a href="#developments" className="text-text-muted hover:text-text">
            Developments
          </a>
          <Link
            href="/login"
            className="bg-brand text-white rounded-md px-4 py-2 font-medium hover:opacity-90"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-accent bg-brand-accent/10 rounded-full px-3 py-1">
            Internal tool · Vive Real Estate
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
            One pipeline for every San Carlos development.
          </h1>
          <p className="mt-5 text-lg text-text-muted">
            Vive Management CRM captures every lead from every Vive Real Estate
            marketing site, routes them to the right agent, and keeps the whole
            team on the same page — from first inquiry to signed contract.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="bg-brand text-white rounded-md px-6 py-3 text-sm font-medium hover:opacity-90"
            >
              Sign in to the CRM
            </Link>
            <a
              href="#features"
              className="border border-border bg-white rounded-md px-6 py-3 text-sm font-medium text-text hover:bg-surface-muted"
            >
              See what&rsquo;s inside
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-1.5 bg-surface-muted px-4 py-2 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-text-muted">
                vive-management-crm.netlify.app/leads
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Pipeline</h3>
                <span className="text-xs text-text-muted">
                  Loma del Mar · All agents
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { stage: "New", count: 8, color: "bg-brand-accent" },
                  { stage: "Contacted", count: 5, color: "bg-brand" },
                  { stage: "Qualified", count: 3, color: "bg-brand" },
                  { stage: "Closed", count: 2, color: "bg-green-600" },
                ].map((col) => (
                  <div
                    key={col.stage}
                    className="bg-surface rounded-md p-2.5 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{col.stage}</span>
                      <span
                        className={`text-[10px] text-white ${col.color} rounded-full px-1.5 py-0.5`}
                      >
                        {col.count}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {Array.from({ length: Math.min(col.count, 3) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="h-8 bg-white border border-border rounded text-[10px] px-2 py-1 text-text-muted"
                          >
                            ▁▁▁▁▁▁
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-semibold">Everything your sales team needs</h2>
          <p className="mt-3 text-text-muted max-w-2xl">
            Built specifically for Vive Real Estate&rsquo;s multi-development
            pipeline — not a generic CRM bent into shape.
          </p>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border border-border rounded-lg p-5 bg-surface"
              >
                <h3 className="font-semibold text-text">{f.title}</h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="developments" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold">Connected developments</h2>
        <p className="mt-3 text-text-muted max-w-2xl">
          Each Vive Real Estate marketing site posts leads directly into this
          CRM. Adding a new development takes a single contact-form snippet.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {DEVELOPMENTS.map((d) => (
            <div
              key={d.name}
              className="border border-border rounded-lg p-5 bg-white"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{d.name}</h3>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    d.status === "Live"
                      ? "bg-green-100 text-green-700"
                      : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-muted">{d.desc}</p>
              {d.href && (
                <a
                  href={d.href}
                  className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
                >
                  Visit site →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold">Ready when your team is.</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Vive Management CRM is a private, invitation-only tool for
            authorized Vive Real Estate staff. Contact your administrator if
            you need access.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block bg-white text-brand rounded-md px-6 py-3 text-sm font-semibold hover:bg-surface"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap gap-x-6 gap-y-2 justify-between text-sm text-text-muted">
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
          <a
            href="https://viverealestate.mx"
            className="hover:text-text"
            target="_blank"
            rel="noreferrer"
          >
            Vive Real Estate
          </a>
        </span>
      </footer>
    </main>
  );
}
