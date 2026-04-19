import { createSupabaseServerClient } from "@/lib/supabase/server";
import LeadsBoard, {
  type BoardLead,
  type Development,
  type AgentOption,
} from "@/components/LeadsBoard";
import AppNav from "@/components/AppNav";
import { getStageLabels } from "@/lib/stage-labels";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const params = await searchParams;
  const selected = params.pipeline ?? "all";

  const supabase = await createSupabaseServerClient();

  const { data: developments } = await supabase
    .from("developments")
    .select("id, slug, name")
    .eq("active", true)
    .order("name")
    .returns<Development[]>();

  let query = supabase
    .from("leads")
    .select(
      `id, first_name, last_name, email, phone, stage, source, budget_max_cents, assigned_agent_id, created_at, development_id,
       developments ( name, slug )`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (selected !== "all") {
    const match = developments?.find((d) => d.slug === selected);
    if (match) query = query.eq("development_id", match.id);
  }

  const { data: leads, error } = await query.returns<BoardLead[]>();
  const stageLabels = await getStageLabels(supabase);

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active")
    .eq("active", true)
    .in("role", ["admin", "sales_agent"])
    .order("full_name", { nullsFirst: false })
    .returns<
      {
        id: string;
        full_name: string | null;
        email: string | null;
        role: string;
        active: boolean;
      }[]
    >();

  const agents: AgentOption[] = (profilesData ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
  }));

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8">
      <AppNav current="leads" />
      <h2 className="text-2xl font-semibold mb-6">Pipeline</h2>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error loading leads: {error.message}
        </div>
      )}

      <LeadsBoard
        leads={leads ?? []}
        developments={developments ?? []}
        selectedDevelopment={selected}
        stageLabels={stageLabels}
        agents={agents}
      />
    </main>
  );
}
