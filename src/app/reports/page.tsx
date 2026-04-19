import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import FunnelPanel from "@/components/reports/FunnelPanel";
import PipelineValuePanel from "@/components/reports/PipelineValuePanel";
import SourcePanel from "@/components/reports/SourcePanel";
import DevelopmentPanel from "@/components/reports/DevelopmentPanel";
import WeeklyNewLeadsPanel from "@/components/reports/WeeklyNewLeadsPanel";
import { getReportData, type Range } from "@/lib/reports/queries";
import { getStageLabels } from "@/lib/stage-labels";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function isRange(value: string | undefined): value is Range {
  return ["7d", "30d", "90d", "all"].includes(value ?? "");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: Range = isRange(params.range) ? params.range : "all";

  const supabase = await createSupabaseServerClient();
  const [data, stageLabels] = await Promise.all([
    getReportData(supabase, range).catch((err) => {
      console.error("Reports load failed", err);
      return null;
    }),
    getStageLabels(supabase),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AppNav current="reports" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Reports</h2>
        <div className="flex items-center gap-1 text-sm">
          {RANGE_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={`/reports?range=${opt.value}`}
              className={`px-3 py-1 rounded-md ${
                range === opt.value
                  ? "bg-brand-accent text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

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
