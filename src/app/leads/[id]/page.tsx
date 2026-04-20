import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { STAGES, type Stage } from "@/app/leads/types";
import { updateLead } from "../actions";
import { getStageLabels } from "@/lib/stage-labels";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  title: string | null;
  business_name: string | null;
  tags: string[] | null;
  notes: string | null;
  stage: Stage;
  status: string;
  source: string;
  budget_max_cents: number | null;
  assigned_agent_id: string | null;
  development_id: string;
  additional_development_ids: string[] | null;
  contact_id: string | null;
  created_at: string;
  developments: { name: string } | null;
  contacts: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type DevRow = { id: string; name: string };

const SOURCES = [
  { value: "website_form", label: "Website form" },
  { value: "referral", label: "Referral" },
  { value: "ad", label: "Ad" },
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "archived", label: "Archived" },
  { value: "duplicate", label: "Duplicate" },
];

function inputCls() {
  return "mt-1 w-full px-3 py-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent";
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [leadResult, agentsResult, stageLabels, devsResult] = await Promise.all([
    supabase
      .from("leads")
      .select(
        `id, title, business_name, tags, notes, stage, status, source, budget_max_cents, assigned_agent_id, development_id, additional_development_ids, contact_id, created_at,
         developments ( name ),
         contacts ( id, first_name, last_name, email, phone )`,
      )
      .eq("id", id)
      .maybeSingle<Lead>(),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("active", true)
      .in("role", ["admin", "sales_agent"])
      .order("full_name", { nullsFirst: false })
      .returns<
        {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string;
        }[]
      >(),
    getStageLabels(supabase),
    supabase
      .from("developments")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .returns<DevRow[]>(),
  ]);

  const lead = leadResult.data;
  if (!lead) notFound();

  const agents = (agentsResult.data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
    role: p.role,
  }));

  const boundUpdate = updateLead.bind(null, lead.id);
  const title = lead.title || "Untitled Opportunity";
  const budgetDollars =
    lead.budget_max_cents != null ? (lead.budget_max_cents / 100).toFixed(2) : "";
  const tagsCsv = (lead.tags ?? []).join(", ");
  const contactName = lead.contacts
    ? [lead.contacts.first_name, lead.contacts.last_name]
        .filter(Boolean)
        .join(" ") || "—"
    : "—";
  const developments = devsResult.data ?? [];
  const additionalSet = new Set(lead.additional_development_ids ?? []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <AppNav current="leads" />
      <a
        href="/leads"
        className="text-sm text-text-muted hover:text-text mb-4 inline-block"
      >
        &larr; Back to pipeline
      </a>

      <h2 className="text-2xl font-semibold mb-1">{title}</h2>
      <p className="text-sm text-text-muted mb-6">
        {lead.developments?.name ?? "—"} &bull; Added{" "}
        {new Date(lead.created_at).toLocaleDateString()}
      </p>

      {saved === "1" && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Saved ✓
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="bg-white border border-border rounded-lg p-6">
          <form action={boundUpdate} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-text">
                Opportunity Name
              </span>
              <input
                name="title"
                defaultValue={lead.title ?? ""}
                className={inputCls()}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-text">Stage</span>
                <select
                  name="stage"
                  defaultValue={lead.stage}
                  className={inputCls()}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {stageLabels[s]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-text">Status</span>
                <select
                  name="status"
                  defaultValue={lead.status}
                  className={inputCls()}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-text">
                Development
                <span className="text-text-muted font-normal">
                  {" "}
                  — which pipeline this lead lives in
                </span>
              </span>
              <select
                name="development_id"
                defaultValue={lead.development_id}
                className={inputCls()}
              >
                {developments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            {developments.length > 1 && (
              <div>
                <p className="text-sm font-medium text-text mb-1">
                  Also interested in
                  <span className="text-text-muted font-normal">
                    {" "}
                    — check any additional developments
                  </span>
                </p>
                <div className="flex flex-wrap gap-3 bg-surface-muted border border-border rounded-md p-3">
                  {developments.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="additional_development_ids"
                        value={d.id}
                        defaultChecked={additionalSet.has(d.id)}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-text">
                  Opportunity Value ($)
                </span>
                <input
                  name="budget_max_cents"
                  type="text"
                  inputMode="decimal"
                  defaultValue={budgetDollars}
                  placeholder="0"
                  className={inputCls()}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-text">Owner</span>
                <select
                  name="assigned_agent_id"
                  defaultValue={lead.assigned_agent_id ?? ""}
                  className={inputCls()}
                >
                  <option value="">— Unassigned —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} {a.role === "admin" ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-text">
                  Opportunity Source
                </span>
                <select
                  name="source"
                  defaultValue={lead.source}
                  className={inputCls()}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-text">
                  Business Name
                </span>
                <input
                  name="business_name"
                  defaultValue={lead.business_name ?? ""}
                  className={inputCls()}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-text">
                Tags
                <span className="text-text-muted font-normal">
                  {" "}
                  — comma separated
                </span>
              </span>
              <input
                name="tags"
                defaultValue={tagsCsv}
                placeholder="e.g. hot lead, needs follow-up"
                className={inputCls()}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text">Notes</span>
              <textarea
                name="notes"
                defaultValue={lead.notes ?? ""}
                rows={5}
                className={inputCls()}
              />
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
            >
              Save Changes
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <h3 className="font-semibold text-text mb-2">Primary Contact</h3>
            {lead.contacts ? (
              <div className="text-sm space-y-1">
                <a
                  href={`/contacts/${lead.contacts.id}`}
                  className="font-medium text-brand-accent hover:underline"
                >
                  {contactName}
                </a>
                {lead.contacts.email && (
                  <p className="text-text-muted">{lead.contacts.email}</p>
                )}
                {lead.contacts.phone && (
                  <p className="text-text-muted">{lead.contacts.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No linked contact.</p>
            )}
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <h3 className="font-semibold text-text mb-2">Coming soon</h3>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Book/Update Appointment</li>
              <li>Tasks</li>
              <li>Notes timeline (activity feed)</li>
              <li>Payments</li>
              <li>Followers</li>
              <li>Additional Contacts</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
