import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import ContactForm, { type AgentOption } from "@/components/ContactForm";
import { updateContact } from "../actions";
import type { ContactType } from "../types";

export const dynamic = "force-dynamic";

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  contact_source: string | null;
  contact_type: ContactType;
  notes: string | null;
  assigned_agent_id: string | null;
  created_at: string;
};

type LinkedLead = {
  id: string;
  stage: string;
  source: string;
  created_at: string;
  developments: { name: string } | null;
};

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error: pageError } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [contactResult, leadsResult, agentsResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, email, phone, date_of_birth, contact_source, contact_type, notes, assigned_agent_id, created_at",
      )
      .eq("id", id)
      .maybeSingle<Contact>(),
    supabase
      .from("leads")
      .select("id, stage, source, created_at, developments ( name )")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .returns<LinkedLead[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("active", true)
      .in("role", ["admin", "sales_agent"])
      .order("full_name", { nullsFirst: false })
      .returns<
        { id: string; full_name: string | null; email: string | null; role: string }[]
      >(),
  ]);

  const contact = contactResult.data;
  if (!contact) notFound();

  const leads = leadsResult.data;
  const agents: AgentOption[] = (agentsResult.data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
    role: p.role,
  }));

  const name =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const boundUpdate = updateContact.bind(null, contact.id);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <AppNav current="contacts" />
      <a
        href="/contacts"
        className="text-sm text-text-muted hover:text-text mb-4 inline-block"
      >
        &larr; Back to contacts
      </a>

      <h2 className="text-2xl font-semibold mb-1">{name}</h2>
      <p className="text-sm text-text-muted mb-6">
        Added {new Date(contact.created_at).toLocaleDateString()}
      </p>

      {saved === "1" && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Saved ✓
        </div>
      )}
      {pageError && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {pageError}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border border-border rounded-lg p-6">
          <ContactForm
            action={boundUpdate}
            values={contact}
            submitLabel="Save Changes"
            agents={agents}
          />
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <h3 className="font-semibold text-text mb-3">Pipeline entries</h3>
            {leads && leads.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {leads.map((l) => (
                  <li key={l.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                    <p className="font-medium text-text">
                      {l.developments?.name ?? "—"}
                    </p>
                    <p className="text-text-muted text-xs">
                      Stage: {l.stage} &bull; Source: {l.source}
                    </p>
                    <p className="text-text-muted text-xs">
                      {new Date(l.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">
                No linked pipeline entries.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
