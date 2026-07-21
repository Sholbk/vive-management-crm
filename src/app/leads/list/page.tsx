import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { getStageLabels } from "@/lib/stage-labels";
import type { Stage } from "@/app/leads/types";

export const dynamic = "force-dynamic";

type ListLead = {
  id: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  stage: Stage;
  source: string | null;
  status: string;
  assigned_agent_id: string | null;
  created_at: string;
  developments: { name: string; slug: string } | null;
};

type Development = { id: string; slug: string; name: string };

const STAGE_COLORS: Partial<Record<Stage, string>> = {
  closed_won: "bg-green-100 text-green-800",
  closed_lost: "bg-gray-200 text-gray-600",
};

export default async function OpportunitiesListPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const params = await searchParams;
  const selected = params.pipeline ?? "all";

  const supabase = await createSupabaseServerClient();

  const [devsResult, stageLabels, profilesResult] = await Promise.all([
    supabase
      .from("developments")
      .select("id, slug, name")
      .eq("active", true)
      .order("name")
      .returns<Development[]>(),
    getStageLabels(supabase),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .returns<{ id: string; full_name: string | null; email: string | null }[]>(),
  ]);

  const developments = devsResult.data ?? [];

  let query = supabase
    .from("leads")
    .select(
      `id, title, first_name, last_name, email, stage, source, status, assigned_agent_id, created_at,
       developments ( name, slug )`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (selected !== "all") {
    const match = developments.find((d) => d.slug === selected);
    if (match) query = query.eq("development_id", match.id);
  }

  const { data: leads, error } = await query.returns<ListLead[]>();

  const agentName = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p.full_name || p.email || "—"]),
  );

  const qs = selected === "all" ? "" : `?pipeline=${encodeURIComponent(selected)}`;

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8">
      <AppNav current="leads" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Opportunities</h2>
        <a
          href={`/leads${qs}`}
          className="px-3 py-1.5 border border-border text-sm font-semibold rounded-md hover:bg-surface-muted"
        >
          Board View
        </a>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
        <span className="text-text-muted">Pipeline:</span>
        <a
          href="/leads/list"
          className={`px-2 py-1 rounded ${
            selected === "all"
              ? "bg-brand-accent text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          All
        </a>
        {developments.map((d) => (
          <a
            key={d.id}
            href={`/leads/list?pipeline=${encodeURIComponent(d.slug)}`}
            className={`px-2 py-1 rounded ${
              selected === d.slug
                ? "bg-brand-accent text-white"
                : "text-text-muted hover:text-text"
            }`}
          >
            {d.name}
          </a>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error loading opportunities: {error.message}
        </div>
      )}

      {!error && (!leads || leads.length === 0) && (
        <p className="text-text-muted text-sm">No opportunities yet.</p>
      )}

      {leads && leads.length > 0 && (
        <div className="border border-border bg-white rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Opportunity</th>
                <th className="text-left px-3 py-2 font-medium">Development</th>
                <th className="text-left px-3 py-2 font-medium">Stage</th>
                <th className="text-left px-3 py-2 font-medium">Agent</th>
                <th className="text-left px-3 py-2 font-medium">Source</th>
                <th className="text-left px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const label =
                  l.title?.trim() ||
                  [l.first_name, l.last_name].filter(Boolean).join(" ") ||
                  l.email ||
                  "Untitled opportunity";
                return (
                  <tr
                    key={l.id}
                    className="border-t border-border hover:bg-surface-muted/50"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={`/leads/${l.id}`}
                        className="text-brand-accent hover:underline font-medium"
                      >
                        {label}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {l.developments?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          STAGE_COLORS[l.stage] ?? "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {stageLabels[l.stage] ?? l.stage}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {l.assigned_agent_id
                        ? (agentName.get(l.assigned_agent_id) ?? "—")
                        : "Unassigned"}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {l.source ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString()}
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
