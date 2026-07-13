import ExcelJS from "exceljs";
import type { ExportLead, ReportData } from "./queries";
import type { StageLabelMap } from "@/lib/stage-labels";

export interface ExportPayload {
  data: ReportData;
  leads: ExportLead[];
  stageLabels: StageLabelMap;
  meta: {
    rangeLabel: string;
    developmentLabel: string;
    ownerLabel: string;
    generatedAt: Date;
  };
}

type Cell = string | number | null;
interface Section {
  title: string;
  headers: string[];
  rows: Cell[][];
}

const dollars = (cents: number | null): number =>
  cents === null ? 0 : cents / 100;

const pct = (value: number | null): Cell =>
  value === null ? "—" : Number(value.toFixed(1));

function isoDate(value: string): string {
  // Spreadsheet-friendly and unambiguous; the raw ISO string sorts as text but
  // reads as a date in both Excel and Sheets.
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * The report as a list of tables. Both exporters render from this so the .xlsx
 * and the .csv can't drift apart into two different definitions of "the report".
 */
function buildSections(payload: ExportPayload): Section[] {
  const { data, stageLabels, meta } = payload;
  const stage = (key: keyof StageLabelMap) => stageLabels[key];

  return [
    {
      title: "Summary",
      headers: ["Metric", "Value"],
      rows: [
        ["Date range", meta.rangeLabel],
        ["Development", meta.developmentLabel],
        ["Assigned agent", meta.ownerLabel],
        ["Total leads", data.totalLeads],
        ["Open pipeline value (USD)", dollars(data.pipelineValue.openTotalCents)],
        ["Generated", meta.generatedAt.toISOString()],
      ],
    },
    {
      title: "Funnel",
      headers: ["Stage", "Leads", "Conversion from previous stage (%)"],
      rows: data.funnel.map((r) => [
        stage(r.stage),
        r.count,
        pct(r.conversionFromPrev),
      ]),
    },
    {
      title: "Pipeline Value",
      headers: ["Stage", "Leads", "Budget total (USD)"],
      rows: data.pipelineValue.byStage.map((r) => [
        stage(r.stage),
        r.count,
        dollars(r.sumCents),
      ]),
    },
    {
      title: "Leads by Source",
      headers: ["Source", "Leads"],
      rows: data.bySource.map((r) => [r.key, r.count]),
    },
    {
      title: "Leads by UTM Source",
      headers: ["UTM source", "Leads"],
      rows: data.byUtmSource.map((r) => [r.key, r.count]),
    },
    {
      title: "By Development",
      headers: ["Development", "Leads", "Won", "Win rate (%)"],
      rows: data.byDevelopment.map((r) => [
        r.name,
        r.total,
        r.won,
        Number(r.winRatePct.toFixed(1)),
      ]),
    },
    {
      title: "Weekly New Leads",
      headers: ["Week starting", "New leads"],
      rows: data.weekly.map((r) => [isoDate(r.weekStart), r.count]),
    },
    {
      title: "Leads",
      headers: [
        "Created",
        "First name",
        "Last name",
        "Email",
        "Phone",
        "Development",
        "Stage",
        "Status",
        "Source",
        "UTM source",
        "UTM medium",
        "UTM campaign",
        "Budget min (USD)",
        "Budget max (USD)",
        "Timeline",
        "Financing",
        "Assigned agent",
      ],
      rows: payload.leads.map((l) => [
        isoDate(l.created_at),
        l.first_name ?? "",
        l.last_name ?? "",
        l.email ?? "",
        l.phone ?? "",
        l.development,
        stage(l.stage),
        l.status,
        l.source,
        l.utm_source ?? "",
        l.utm_medium ?? "",
        l.utm_campaign ?? "",
        dollars(l.budget_min_cents),
        dollars(l.budget_max_cents),
        l.timeline ?? "",
        l.financing ?? "",
        l.assigned_agent,
      ]),
    },
  ];
}

function csvCell(value: Cell): string {
  if (value === null) return "";
  const s = String(value);
  // A leading =, +, - or @ makes Excel/Sheets treat the cell as a formula. A
  // lead's message or name is attacker-controlled, so prefix those with a
  // quote to keep them inert text rather than something the spreadsheet runs.
  const escaped = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(escaped) ? `"${escaped.replace(/"/g, '""')}"` : escaped;
}

export function buildReportCsv(payload: ExportPayload): string {
  const lines: string[] = [];
  for (const section of buildSections(payload)) {
    lines.push(csvCell(section.title));
    lines.push(section.headers.map(csvCell).join(","));
    for (const row of section.rows) lines.push(row.map(csvCell).join(","));
    lines.push("");
  }
  // BOM so Excel reads UTF-8 (accented development names) instead of mojibake.
  return "﻿" + lines.join("\r\n");
}

export async function buildReportWorkbook(
  payload: ExportPayload,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Vive Management CRM";
  wb.created = payload.meta.generatedAt;

  for (const section of buildSections(payload)) {
    // Excel sheet names cap at 31 chars and reject : \ / ? * [ ]
    const name = section.title.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
    const sheet = wb.addWorksheet(name);

    const header = sheet.addRow(section.headers);
    header.font = { bold: true };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A437B" }, // Vive navy
    };
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const row of section.rows) {
      sheet.addRow(row.map((c) => (c === null ? "" : c)));
    }

    sheet.columns.forEach((col) => {
      let widest = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        widest = Math.max(widest, String(cell.value ?? "").length + 2);
      });
      col.width = Math.min(widest, 40);
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
