import type { FunnelRow } from "@/lib/reports/queries";
import type { Stage } from "@/app/leads/types";

const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  showing: "Showing",
  offer: "Offer",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function FunnelPanel({ funnel }: { funnel: FunnelRow[] }) {
  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Pipeline Funnel</h3>
      <div className="flex gap-2 overflow-x-auto">
        {funnel.map((row) => (
          <div
            key={row.stage}
            className="flex-shrink-0 w-36 p-3 bg-surface-muted rounded-md"
          >
            <p className="text-xs text-text-muted uppercase tracking-wide">
              {STAGE_LABELS[row.stage]}
            </p>
            <p className="text-2xl font-bold text-text">{row.count}</p>
            {row.conversionFromPrev !== null && (
              <p className="text-xs text-text-muted mt-1">
                {row.conversionFromPrev.toFixed(0)}% from prev
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
