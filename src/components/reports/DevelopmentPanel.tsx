import type { DevelopmentRow } from "@/lib/reports/queries";

export default function DevelopmentPanel({
  rows,
}: {
  rows: DevelopmentRow[];
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Leads by Development</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">No data for this range.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-1">Development</th>
              <th className="text-right py-1">Total</th>
              <th className="text-right py-1">Won</th>
              <th className="text-right py-1">Win rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.developmentId} className="border-t border-border">
                <td className="py-1.5">{row.name}</td>
                <td className="py-1.5 text-right">{row.total}</td>
                <td className="py-1.5 text-right">{row.won}</td>
                <td className="py-1.5 text-right">
                  {row.winRatePct.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
