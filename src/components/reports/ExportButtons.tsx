import type { Range } from "@/lib/reports/queries";

/**
 * Plain links, not fetch handlers: the browser's own download machinery deals
 * with Content-Disposition, so there's no blob juggling and the export URL
 * stays shareable. Filters are forwarded so the file always matches what the
 * page is currently showing.
 */
export default function ExportButtons({
  range,
  ownerId,
  developmentId,
}: {
  range: Range;
  ownerId: string | null;
  developmentId: string | null;
}) {
  const params = new URLSearchParams({ range });
  if (ownerId) params.set("owner", ownerId);
  if (developmentId) params.set("development", developmentId);

  const href = (format: "xlsx" | "csv") =>
    `/reports/export?${params.toString()}&format=${format}`;

  const base =
    "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface";

  return (
    <div className="flex items-center gap-2">
      <a href={href("xlsx")} className={`${base} bg-brand text-white border-brand hover:opacity-90`}>
        Export to Excel
      </a>
      <a href={href("csv")} className={base}>
        Export CSV
      </a>
    </div>
  );
}
