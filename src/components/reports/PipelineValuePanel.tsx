import { formatCents, type PipelineValue } from "@/lib/reports/queries";
import type { StageLabelMap } from "@/lib/stage-labels";

export default function PipelineValuePanel({
  value,
  stageLabels,
}: {
  value: PipelineValue;
  stageLabels: StageLabelMap;
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-1">Pipeline Value</h3>
      <p className="text-xs text-text-muted mb-4">
        Sum of budget_max on open leads (excluding Closed Lost)
      </p>
      <p className="text-4xl font-bold text-text mb-6">
        {formatCents(value.openTotalCents)}
      </p>

      <table className="w-full text-sm">
        <thead className="text-text-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left py-1">Stage</th>
            <th className="text-right py-1">Count</th>
            <th className="text-right py-1">Value</th>
          </tr>
        </thead>
        <tbody>
          {value.byStage.map((row) => (
            <tr key={row.stage} className="border-t border-border">
              <td className="py-1.5">{stageLabels[row.stage]}</td>
              <td className="py-1.5 text-right">{row.count}</td>
              <td className="py-1.5 text-right">{formatCents(row.sumCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
