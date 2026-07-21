import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import ContactsTable, {
  type ContactListRow,
} from "@/components/contacts/ContactsTable";
import { CONTACT_TYPES, type ContactType } from "./types";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<ContactType, string> = {
  lead: "Lead",
  client: "Client",
  vendor: "Vendor",
  other: "Other",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter =
    params.type && (CONTACT_TYPES as readonly string[]).includes(params.type)
      ? (params.type as ContactType)
      : null;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, phone, contact_source, contact_type, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (typeFilter) query = query.eq("contact_type", typeFilter);

  const { data, error } = await query.returns<ContactListRow[]>();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AppNav current="contacts" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Contacts</h2>
        <a
          href="/contacts/new"
          className="px-3 py-1.5 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
        >
          + New Contact
        </a>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-text-muted">Filter:</span>
        <a
          href="/contacts"
          className={`px-2 py-1 rounded ${
            typeFilter === null
              ? "bg-brand-accent text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          All
        </a>
        {CONTACT_TYPES.map((t) => (
          <a
            key={t}
            href={`/contacts?type=${t}`}
            className={`px-2 py-1 rounded ${
              typeFilter === t
                ? "bg-brand-accent text-white"
                : "text-text-muted hover:text-text"
            }`}
          >
            {TYPE_LABELS[t]}
          </a>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error loading contacts: {error.message}
        </div>
      )}

      {!error && (!data || data.length === 0) && (
        <p className="text-text-muted text-sm">No contacts yet.</p>
      )}

      {data && data.length > 0 && <ContactsTable rows={data} />}
    </main>
  );
}
