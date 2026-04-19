import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { CONTACT_TYPES, type ContactType } from "./types";

export const dynamic = "force-dynamic";

type ContactRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  contact_source: string | null;
  contact_type: ContactType;
  created_at: string;
};

const TYPE_LABELS: Record<ContactType, string> = {
  lead: "Lead",
  client: "Client",
  vendor: "Vendor",
  other: "Other",
};

const TYPE_COLORS: Record<ContactType, string> = {
  lead: "bg-blue-100 text-blue-800",
  client: "bg-green-100 text-green-800",
  vendor: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-700",
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

  const { data, error } = await query.returns<ContactRow[]>();

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

      {data && data.length > 0 && (
        <div className="border border-border bg-white rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Email</th>
                <th className="text-left px-3 py-2 font-medium">Phone</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Source</th>
                <th className="text-left px-3 py-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => {
                const name =
                  [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <tr
                    key={c.id}
                    className="border-t border-border hover:bg-surface-muted/50"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={`/contacts/${c.id}`}
                        className="text-brand-accent hover:underline font-medium"
                      >
                        {name}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {c.email ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          TYPE_COLORS[c.contact_type]
                        }`}
                      >
                        {TYPE_LABELS[c.contact_type]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {c.contact_source ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
