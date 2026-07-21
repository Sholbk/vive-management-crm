"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentDialog, { type LeadOption } from "./AppointmentDialog";
import AppointmentsSidebar from "./AppointmentsSidebar";

export interface CalendarAppointment {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  leadId: string;
  leadTitle: string | null;
}

export interface CalendarTask {
  id: string;
  title: string;
  /** Plain YYYY-MM-DD from the date column — no timezone conversion. */
  dueDate: string;
  completed: boolean;
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

type DialogState =
  | { mode: "create"; date: string }
  | { mode: "edit"; appointment: CalendarAppointment }
  | null;

export default function MonthCalendar({
  year,
  month,
  appointments,
  upcoming,
  past,
  tasks,
  openTasks,
  leadOptions,
  agents,
  agentId,
  initialApptId,
}: {
  year: number;
  month: number;
  appointments: CalendarAppointment[];
  /** Appointments from now forward, any month, ascending. */
  upcoming: CalendarAppointment[];
  /** Most recent past appointments, descending. */
  past: CalendarAppointment[];
  /** Tasks due within the visible grid. */
  tasks: CalendarTask[];
  /** All incomplete dated tasks, soonest first (sidebar). */
  openTasks: CalendarTask[];
  leadOptions: LeadOption[];
  agents: { id: string; label: string }[];
  agentId: string | null;
  /** Opens this appointment's edit dialog on load (sidebar cross-month nav). */
  initialApptId?: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);

  function calHref(ymStr: string | null, extra?: Record<string, string>) {
    const sp = new URLSearchParams();
    if (ymStr) sp.set("ym", ymStr);
    if (agentId) sp.set("agent", agentId);
    for (const [k, v] of Object.entries(extra ?? {})) sp.set(k, v);
    const q = sp.toString();
    return q ? `/calendar?${q}` : "/calendar";
  }

  // 6x7 grid starting from the Sunday on or before the 1st of the month.
  // This math only uses year/month/day parts, so it's timezone-independent
  // and safe to render on the server.
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }

  // Which *day* a UTC timestamp falls on depends on the viewer's timezone,
  // which only the browser knows (the server renders in UTC on Netlify).
  // Bucket after mount so server HTML never disagrees with the client and
  // evening appointments don't shift into the wrong day cell.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sidebar cross-month navigation lands here with ?appt=<id>: open its edit
  // dialog once the grid for its month is showing.
  useEffect(() => {
    if (!initialApptId) return;
    const target =
      appointments.find((a) => a.id === initialApptId) ??
      upcoming.find((a) => a.id === initialApptId) ??
      past.find((a) => a.id === initialApptId);
    if (target) setDialog({ mode: "edit", appointment: target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialApptId]);

  const byDay = new Map<string, CalendarAppointment[]>();
  if (mounted) {
    for (const a of appointments) {
      const key = dayKey(new Date(a.scheduledAt));
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(a);
    }
  }

  // due_date is a plain date, so tasks bucket by exact string — safe to
  // render server-side, no hydration gate needed.
  const tasksByDay = new Map<string, CalendarTask[]>();
  for (const t of tasks) {
    if (!tasksByDay.has(t.dueDate)) tasksByDay.set(t.dueDate, []);
    tasksByDay.get(t.dueDate)!.push(t);
  }

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const todayKey = mounted ? dayKey(new Date()) : null;

  // Count only what actually renders in the visible grid, so the header can
  // never claim appointments the grid doesn't show.
  const visibleCount = cells.reduce(
    (n, d) => n + (byDay.get(dayKey(d))?.length ?? 0),
    0,
  );
  const visibleTaskCount = cells.reduce(
    (n, d) => n + (tasksByDay.get(dayKey(d))?.length ?? 0),
    0,
  );

  // "Today" resolves the current month in the viewer's timezone; the bare
  // /calendar fallback (server clock) is only used pre-hydration.
  const now = new Date();
  const todayHref = mounted
    ? calHref(ym(now.getFullYear(), now.getMonth()))
    : calHref(null);

  // Sidebar sections split at the viewer's local start of today, so an
  // appointment from earlier today still counts as "upcoming", not past.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingList = [
    ...past.filter((a) => new Date(a.scheduledAt) >= todayStart),
    ...upcoming,
  ].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const pastList = past.filter((a) => new Date(a.scheduledAt) < todayStart);

  function closeDialog() {
    setDialog(null);
    if (initialApptId) {
      // Drop ?appt= so a refresh doesn't reopen the dialog.
      router.replace(calHref(ym(year, month)), { scroll: false });
    }
  }

  function openFromSidebar(a: CalendarAppointment) {
    const d = new Date(a.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      setDialog({ mode: "edit", appointment: a });
    } else {
      // Navigate the grid to the appointment's month; ?appt= reopens the
      // edit dialog there with the chip visible behind it.
      router.push(calHref(ym(d.getFullYear(), d.getMonth()), { appt: a.id }));
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div>
        <div className="mb-4 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-2xl font-semibold whitespace-nowrap">
              {MONTH_NAMES[month]} {year}
            </h3>
            <p className="text-sm text-text-muted">
              {mounted
                ? `${visibleCount} appointment${visibleCount === 1 ? "" : "s"}${
                    visibleTaskCount > 0
                      ? ` · ${visibleTaskCount} task${visibleTaskCount === 1 ? "" : "s"}`
                      : ""
                  }`
                : " "}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={calHref(ym(prev.getFullYear(), prev.getMonth()))}
              className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
            >
              ←
            </a>
            <a
              href={todayHref}
              className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
            >
              Today
            </a>
            <a
              href={calHref(ym(next.getFullYear(), next.getMonth()))}
              className="px-3 py-1 border border-border rounded text-sm hover:bg-surface-muted"
            >
              →
            </a>
            <label className="flex items-center gap-2 text-sm ml-2">
              <span className="text-text-muted">Agent:</span>
              <select
                value={agentId ?? ""}
                onChange={(e) => {
                  const sp = new URLSearchParams({ ym: ym(year, month) });
                  if (e.target.value) sp.set("agent", e.target.value);
                  router.push(`/calendar?${sp.toString()}`);
                }}
                className="border border-border rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">All</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
                onClick={() => setDialog({ mode: "create", date: key })}
                title="Add appointment"
                className={`min-h-28 p-2 border-b border-r border-border cursor-pointer hover:bg-brand-accent/5 ${
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialog({ mode: "edit", appointment: a });
                        }}
                        className={`block w-full text-left text-[11px] truncate px-1.5 py-0.5 rounded ${
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
                      </button>
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li className="text-[11px] text-text-muted">
                      +{items.length - 3} more
                    </li>
                  )}
                  {(tasksByDay.get(key) ?? []).slice(0, 2).map((t) => (
                    <li key={t.id}>
                      <a
                        href={`/leads/${t.leadId}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`Task${t.leadTitle ? ` — ${t.leadTitle}` : ""}: ${t.title}`}
                        className={`block w-full text-left text-[11px] truncate px-1.5 py-0.5 rounded border ${
                          t.completed
                            ? "border-border bg-surface-muted text-text-muted line-through"
                            : "border-amber-300 bg-amber-50 text-amber-900"
                        }`}
                      >
                        ✓ {t.title}
                      </a>
                    </li>
                  ))}
                  {(tasksByDay.get(key)?.length ?? 0) > 2 && (
                    <li className="text-[11px] text-text-muted">
                      +{(tasksByDay.get(key)?.length ?? 0) - 2} more task
                      {(tasksByDay.get(key)?.length ?? 0) - 2 === 1 ? "" : "s"}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {mounted ? (
        <AppointmentsSidebar
          upcoming={upcomingList}
          past={pastList}
          tasks={openTasks}
          onSelect={openFromSidebar}
        />
      ) : (
        <aside className="bg-white border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text">Upcoming</h3>
        </aside>
      )}

      {dialog && (
        <AppointmentDialog
          mode={dialog.mode}
          initialDate={dialog.mode === "create" ? dialog.date : undefined}
          appointment={dialog.mode === "edit" ? dialog.appointment : undefined}
          leadOptions={leadOptions}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
