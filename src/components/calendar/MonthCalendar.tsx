export interface CalendarAppointment {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  leadId: string;
  leadTitle: string | null;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ym(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MonthCalendar({
  year,
  month,
  appointments,
}: {
  year: number;
  month: number;
  appointments: CalendarAppointment[];
}) {
  // 6x7 grid starting from the Sunday on or before the 1st of the month.
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }

  // Bucket appointments by local day.
  const byDay = new Map<string, CalendarAppointment[]>();
  for (const a of appointments) {
    const d = new Date(a.scheduledAt);
    const key = dayKey(d);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(a);
  }

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const todayKey = dayKey(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <a
            href={`/calendar?ym=${ym(prev.getFullYear(), prev.getMonth())}`}
            className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
          >
            ←
          </a>
          <a
            href="/calendar"
            className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
          >
            Today
          </a>
          <a
            href={`/calendar?ym=${ym(next.getFullYear(), next.getMonth())}`}
            className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
          >
            →
          </a>
        </div>
        <h3 className="text-xl font-semibold">
          {MONTH_NAMES[month]} {year}
        </h3>
        <p className="text-sm text-text-muted">
          {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-7 bg-white border border-border rounded-lg overflow-hidden">
        {DOW.map((d) => (
          <div
            key={d}
            className="p-2 text-xs font-semibold uppercase tracking-wider text-text-muted bg-surface-muted border-b border-border text-center"
          >
            {d}
          </div>
        ))}

        {cells.map((d) => {
          const inMonth = d.getMonth() === month;
          const key = dayKey(d);
          const isToday = key === todayKey;
          const items = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-28 p-2 border-b border-r border-border ${
                !inMonth ? "bg-surface-muted/40" : ""
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  isToday
                    ? "bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center"
                    : inMonth
                      ? "text-text"
                      : "text-text-muted"
                }`}
              >
                {d.getDate()}
              </p>
              <ul className="mt-1 space-y-1">
                {items.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/leads/${a.leadId}`}
                      className={`block text-[11px] truncate px-1.5 py-0.5 rounded ${
                        a.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : a.status === "cancelled"
                            ? "bg-gray-200 text-gray-600 line-through"
                            : "bg-brand-accent/15 text-brand-accent"
                      }`}
                    >
                      {new Date(a.scheduledAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      {a.title}
                    </a>
                  </li>
                ))}
                {items.length > 3 && (
                  <li className="text-[11px] text-text-muted">
                    +{items.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
