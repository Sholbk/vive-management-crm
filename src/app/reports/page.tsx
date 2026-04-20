import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import ReportsFilters from "@/components/reports/ReportsFilters";
import FunnelPanel from "@/components/reports/FunnelPanel";
import PipelineValuePanel from "@/components/reports/PipelineValuePanel";
import SourcePanel from "@/components/reports/SourcePanel";
import DevelopmentPanel from "@/components/reports/DevelopmentPanel";
import WeeklyNewLeadsPanel from "@/components/reports/WeeklyNewLeadsPanel";
import { getReportData, type Range } from "@/lib/reports/queries";
import { getStageLabels } from "@/lib/stage-labels";

export const dynamic = "force-dynamic";

function isRange(value: string | undefined): value is Range {
  return ["7d", "30d", "90d", "all"].includes(value ?? "");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    owner?: string;
    development?: string;
  }>;
}) {
  const params = await searchParams;
  const range: Range = isRange(params.range) ? params.range : "all";
  const ownerId = params.owner || null;
  const developmentId = params.development || null;

  const supabase = await createSupabaseServerClient();
  const [data, stageLabels, agentsResult, devsResult] = await Promise.all([
    getReportData(supabase, range, { ownerId, developmentId }).catch((err) => {
      console.error("Reports load failed", err);
      return null;
    }),
    getStageLabels(supabase),
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
    supabase
      .from("developments")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  const agents = (agentsResult.data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AppNav current="reports" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-semibold">Reports</h2>
      </div>

      <ReportsFilters
        range={range}
        ownerId={ownerId}
        developmentId={developmentId}
        agents={agents}
        developments={devsResult.data ?? []}
      />

      {data === null ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Failed to load report data. Check server logs.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            {data.totalLeads} lead{data.totalLeads === 1 ? "" : "s"} in this
            range
          </p>

          <FunnelPanel funnel={data.funnel} stageLabels={stageLabels} />

          <div className="grid lg:grid-cols-2 gap-4">
            <PipelineValuePanel
              value={data.pipelineValue}
              stageLabels={stageLabels}
            />
            <SourcePanel
              bySource={data.bySource}
              byUtmSource={data.byUtmSource}
              total={data.totalLeads}
            />
          </div>

          <DevelopmentPanel rows={data.byDevelopment} />
          <WeeklyNewLeadsPanel weekly={data.weekly} />
        </div>
      )}
    </main>
  );
}
