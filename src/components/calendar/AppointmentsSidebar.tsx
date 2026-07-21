"use client";

import type { CalendarAppointment, CalendarTask } from "./MonthCalendar";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({
  appointment,
  onSelect,
}: {
  appointment: CalendarAppointment;
  onSelect: (a: CalendarAppointment) => void;
}) {
  const cancelled = appointment.status === "cancelled";
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(appointment)}
        className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-muted"
      >
        <p
          className={`text-sm font-medium truncate ${
            cancelled ? "text-text-muted line-through" : "text-text"
          }`}
        >
          {appointment.title}
        </p>
        <p className="text-xs text-text-muted">
          {fmtDate(appointment.scheduledAt)} &bull;{" "}
          {fmtTime(appointment.scheduledAt)}
        </p>
        {appointment.leadTitle && (
          <p className="text-xs text-brand-accent truncate">
            {appointment.leadTitle}
          </p>
        )}
      </button>
    </li>
  );
}

/**
 * Month-independent appointment list: everything from today forward, plus the
 * most recent past appointments, so the panel is never empty while any
 * appointment exists in a reasonable window.
 */
function TaskRow({ task }: { task: CalendarTask }) {
  // due_date is date-only; parse as local midnight so "due today" doesn't
  // read as overdue in timezones behind UTC.
  const due = new Date(`${task.dueDate}T00:00:00`);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdue = due < todayStart;
  return (
    <li>
      <a
        href={`/leads/${task.leadId}`}
        className="block px-2 py-1.5 rounded hover:bg-surface-muted"
      >
        <p className="text-sm font-medium truncate text-text">{task.title}</p>
        <p className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-text-muted"}`}>
          {overdue ? "Overdue — " : "Due "}
          {due.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {task.leadTitle && (
          <p className="text-xs text-brand-accent truncate">{task.leadTitle}</p>
        )}
      </a>
    </li>
  );
}

export default function AppointmentsSidebar({
  upcoming,
  past,
  tasks,
  onSelect,
}: {
  upcoming: CalendarAppointment[];
  past: CalendarAppointment[];
  tasks: CalendarTask[];
  onSelect: (a: CalendarAppointment) => void;
}) {
  return (
    <aside className="space-y-4">
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="font-semibold text-text mb-2">Upcoming</h3>
        {upcoming.length > 0 ? (
          <ul className="space-y-1 -mx-2">
            {upcoming.map((a) => (
              <Row key={a.id} appointment={a} onSelect={onSelect} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">
            No upcoming appointments — click any day to add one.
          </p>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text mb-2">Tasks</h3>
          <ul className="space-y-1 -mx-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text mb-2">Recent</h3>
          <ul className="space-y-1 -mx-2">
            {past.map((a) => (
              <Row key={a.id} appointment={a} onSelect={onSelect} />
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
