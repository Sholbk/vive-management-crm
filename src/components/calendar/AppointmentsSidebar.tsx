"use client";

import type { CalendarAppointment } from "./MonthCalendar";

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
export default function AppointmentsSidebar({
  upcoming,
  past,
  onSelect,
}: {
  upcoming: CalendarAppointment[];
  past: CalendarAppointment[];
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
