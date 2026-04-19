import type { SupabaseClient } from "@supabase/supabase-js";
import { STAGES, type Stage } from "@/app/leads/types";

export type Range = "7d" | "30d" | "90d" | "all";

export function rangeToDate(range: Range): string | null {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : null;
  if (days === null) return null;
  return new Date(Date.now() - days * 86400_000).toISOString();
}

type RawLead = {
  stage: Stage;
  status: "open" | "archived" | "duplicate";
  source: string;
  utm_source: string | null;
  budget_max_cents: number | null;
  development_id: string;
  created_at: string;
  developments: { name: string } | null;
};

export interface FunnelRow {
  stage: Stage;
  count: number;
  conversionFromPrev: number | null;
}

export interface PipelineValue {
  openTotalCents: number;
  byStage: { stage: Stage; count: number; sumCents: number }[];
}

export interface SourceRow {
  key: string;
  count: number;
}

export interface DevelopmentRow {
  developmentId: string;
  name: string;
  total: number;
  won: number;
  winRatePct: number;
}

export interface WeekBucket {
  weekStart: string;
  count: number;
}

export interface ReportData {
  totalLeads: number;
  funnel: FunnelRow[];
  pipelineValue: PipelineValue;
  bySource: SourceRow[];
  byUtmSource: SourceRow[];
  byDevelopment: DevelopmentRow[];
  weekly: WeekBucket[];
}

export async function getReportData(
  supabase: SupabaseClient,
  range: Range,
): Promise<ReportData> {
  const dateFrom = rangeToDate(range);

  let query = supabase
    .from("leads")
    .select(
      "stage, status, source, utm_source, budget_max_cents, development_id, created_at, developments ( name )",
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  if (dateFrom) query = query.gte("created_at", dateFrom);

  const { data: leads, error } = await query.returns<RawLead[]>();
  if (error) throw error;
  const rows = leads ?? [];

  const funnel = buildFunnel(rows);
  const pipelineValue = buildPipelineValue(rows);
  const bySource = groupCount(rows.map((r) => r.source));
  const byUtmSource = groupCount(
    rows.map((r) => r.utm_source).filter((s): s is string => Boolean(s)),
  ).slice(0, 5);
  const byDevelopment = buildByDevelopment(rows);
  const weekly = buildWeekly(rows);

  return {
    totalLeads: rows.length,
    funnel,
    pipelineValue,
    bySource,
    byUtmSource,
    byDevelopment,
    weekly,
  };
}

function buildFunnel(rows: RawLead[]): FunnelRow[] {
  const counts = new Map<Stage, number>();
  for (const s of STAGES) counts.set(s, 0);
  for (const r of rows) counts.set(r.stage, (counts.get(r.stage) ?? 0) + 1);

  let prev: number | null = null;
  return STAGES.map((stage) => {
    const count = counts.get(stage) ?? 0;
    const conversionFromPrev =
      prev !== null && prev > 0 ? (count / prev) * 100 : null;
    prev = count;
    return { stage, count, conversionFromPrev };
  });
}

function buildPipelineValue(rows: RawLead[]): PipelineValue {
  const byStageMap = new Map<Stage, { count: number; sumCents: number }>();
  for (const s of STAGES) byStageMap.set(s, { count: 0, sumCents: 0 });

  let openTotalCents = 0;
  for (const r of rows) {
    const bucket = byStageMap.get(r.stage)!;
    bucket.count += 1;
    bucket.sumCents += r.budget_max_cents ?? 0;
    if (r.status === "open" && r.stage !== "closed_lost") {
      openTotalCents += r.budget_max_cents ?? 0;
    }
  }

  const byStage = STAGES.map((stage) => ({
    stage,
    count: byStageMap.get(stage)!.count,
    sumCents: byStageMap.get(stage)!.sumCents,
  }));

  return { openTotalCents, byStage };
}

function groupCount(values: string[]): SourceRow[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function buildByDevelopment(rows: RawLead[]): DevelopmentRow[] {
  const m = new Map<
    string,
    { name: string; total: number; won: number }
  >();
  for (const r of rows) {
    const name = r.developments?.name ?? "—";
    const existing = m.get(r.development_id) ?? {
      name,
      total: 0,
      won: 0,
    };
    existing.total += 1;
    if (r.stage === "closed_won") existing.won += 1;
    m.set(r.development_id, existing);
  }
  return [...m.entries()]
    .map(([developmentId, v]) => ({
      developmentId,
      name: v.name,
      total: v.total,
      won: v.won,
      winRatePct: v.total > 0 ? (v.won / v.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function buildWeekly(rows: RawLead[]): WeekBucket[] {
  const now = new Date();
  // Anchor to Monday of current week (UTC).
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(
    now.getUTCDate() - ((day + 6) % 7),
  );
  monday.setUTCHours(0, 0, 0, 0);

  const buckets: WeekBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(monday);
    start.setUTCDate(monday.getUTCDate() - i * 7);
    buckets.push({ weekStart: start.toISOString(), count: 0 });
  }

  for (const r of rows) {
    const created = new Date(r.created_at);
    for (let i = 0; i < buckets.length; i++) {
      const start = new Date(buckets[i].weekStart);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 7);
      if (created >= start && created < end) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  return buckets;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
