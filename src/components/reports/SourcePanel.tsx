import type { SourceRow } from "@/lib/reports/queries";

const SOURCE_LABELS: Record<string, string> = {
  website_form: "Website form",
  referral: "Referral",
  ad: "Ad",
  walk_in: "Walk-in",
  phone: "Phone",
  other: "Other",
};

function BarRow({ row, total }: { row: SourceRow; total: number }) {
  const pct = total > 0 ? (row.count / total) * 100 : 0;
  const label = SOURCE_LABELS[row.key] ?? row.key;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text">{label}</span>
        <span className="text-text-muted">{row.count}</span>
      </div>
      <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SourcePanel({
  bySource,
  byUtmSource,
  total,
}: {
  bySource: SourceRow[];
  byUtmSource: SourceRow[];
  total: number;
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Leads by Source</h3>

      {bySource.length === 0 ? (
        <p className="text-sm text-text-muted">No data for this range.</p>
      ) : (
        bySource.map((row) => <BarRow key={row.key} row={row} total={total} />)
      )}

      {byUtmSource.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">
            Top UTM sources
          </h4>
          <ul className="text-sm space-y-1">
            {byUtmSource.map((row) => (
              <li key={row.key} className="flex justify-between">
                <span className="text-text font-mono text-xs">{row.key}</span>
                <span className="text-text-muted">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
