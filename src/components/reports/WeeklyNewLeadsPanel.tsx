import type { WeekBucket } from "@/lib/reports/queries";

export default function WeeklyNewLeadsPanel({
  weekly,
}: {
  weekly: WeekBucket[];
}) {
  const max = Math.max(...weekly.map((w) => w.count), 1);
  const chartHeight = 120;
  const barWidth = 32;
  const gap = 8;
  const chartWidth = weekly.length * (barWidth + gap);

  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-1">New Leads — Last 12 Weeks</h3>
      <p className="text-xs text-text-muted mb-4">Rightmost bar is this week</p>
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight + 30}
          className="text-brand-accent"
        >
          {weekly.map((w, i) => {
            const h = (w.count / max) * chartHeight;
            const x = i * (barWidth + gap);
            const y = chartHeight - h;
            return (
              <g key={w.weekStart}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill="currentColor"
                  rx={2}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                >
                  {w.count > 0 ? w.count : ""}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fontSize="9"
                  className="fill-current text-text-muted"
                >
                  {new Date(w.weekStart).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
