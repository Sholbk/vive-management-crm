import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStageLabels } from "@/lib/stage-labels";
import {
  getReportData,
  getReportLeads,
  type Range,
} from "@/lib/reports/queries";
import { buildReportCsv, buildReportWorkbook } from "@/lib/reports/export";

export const dynamic = "force-dynamic";

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function isRange(value: string | null): value is Range {
  return ["7d", "30d", "90d", "all"].includes(value ?? "");
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // The proxy already gates this path, but the export streams contact PII, so
  // it re-checks rather than trusting an upstream matcher to stay correct.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "csv" ? "csv" : "xlsx";
  const range: Range = isRange(params.get("range")) ? (params.get("range") as Range) : "all";
  const ownerId = params.get("owner") || null;
  const developmentId = params.get("development") || null;

  try {
    // All reads go through the RLS-bound client, so the export can never
    // contain a lead the requester couldn't already open in the UI.
    const [data, leads, stageLabels] = await Promise.all([
      getReportData(supabase, range, { ownerId, developmentId }),
      getReportLeads(supabase, range, { ownerId, developmentId }),
      getStageLabels(supabase),
    ]);

    const [devRow, ownerRow] = await Promise.all([
      developmentId
        ? supabase
            .from("developments")
            .select("name")
            .eq("id", developmentId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      ownerId
        ? supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", ownerId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const owner = ownerRow.data as {
      full_name: string | null;
      email: string | null;
    } | null;

    const payload = {
      data,
      leads,
      stageLabels,
      meta: {
        rangeLabel: RANGE_LABELS[range],
        developmentLabel:
          (devRow.data as { name: string } | null)?.name ?? "All developments",
        ownerLabel: owner
          ? (owner.full_name ?? owner.email ?? "—")
          : "All agents",
        generatedAt: new Date(),
      },
    };

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `vive-crm-report-${range}-${stamp}.${format}`;

    if (format === "csv") {
      return new NextResponse(buildReportCsv(payload), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const workbook = await buildReportWorkbook(payload);
    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Report export failed", err);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
