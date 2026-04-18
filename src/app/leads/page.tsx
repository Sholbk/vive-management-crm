import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string;
  utm_source: string | null;
  created_at: string;
  development_id: string;
  developments: { name: string; slug: string } | null;
};

export default async function LeadsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `id, first_name, last_name, email, phone, stage, source, utm_source, created_at, development_id,
       developments ( name, slug )`,
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LeadRow[]>();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-text-muted hover:text-text"
          >
            Sign out
          </button>
        </form>
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error loading leads: {error.message}
        </div>
      )}

      {!error && (!leads || leads.length === 0) && (
        <p className="text-text-muted text-sm">No leads yet.</p>
      )}

      {leads && leads.length > 0 && (
        <div className="border border-border bg-white rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Created</th>
                <th className="text-left px-3 py-2 font-medium">Development</th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Contact</th>
                <th className="text-left px-3 py-2 font-medium">Stage</th>
                <th className="text-left px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {lead.developments?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {[lead.first_name, lead.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div>{lead.email}</div>
                    <div className="text-text-muted text-xs">
                      {lead.phone ?? ""}
                    </div>
                  </td>
                  <td className="px-3 py-2">{lead.stage}</td>
                  <td className="px-3 py-2">
                    <div>{lead.source}</div>
                    {lead.utm_source && (
                      <div className="text-text-muted text-xs">
                        utm: {lead.utm_source}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
