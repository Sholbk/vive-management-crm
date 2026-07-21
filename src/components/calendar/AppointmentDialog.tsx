"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCalendarAppointment,
  updateCalendarAppointment,
  deleteCalendarAppointment,
} from "@/app/calendar/actions";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { CalendarAppointment } from "./MonthCalendar";

export interface LeadOption {
  id: string;
  label: string;
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  "mt-1 w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent";

export default function AppointmentDialog({
  mode,
  initialDate,
  appointment,
  leadOptions,
  onClose,
}: {
  mode: "create" | "edit";
  /** yyyy-mm-dd prefill for create mode. */
  initialDate?: string;
  appointment?: CalendarAppointment;
  leadOptions: LeadOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [date, setDate] = useState(
    appointment ? toDateInput(appointment.scheduledAt) : (initialDate ?? ""),
  );
  const [time, setTime] = useState(
    appointment ? toTimeInput(appointment.scheduledAt) : "09:00",
  );
  const [leadId, setLeadId] = useState(appointment?.leadId ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "scheduled");
  const [leadFilter, setLeadFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    const q = leadFilter.trim().toLowerCase();
    const matches = q
      ? leadOptions.filter((l) => l.label.toLowerCase().includes(q))
      : leadOptions;
    // Keep the currently selected opportunity pickable even when the filter
    // hides it, so filtering can't silently clear the selection.
    const selected = leadOptions.find((l) => l.id === leadId);
    if (selected && !matches.some((l) => l.id === selected.id)) {
      return [selected, ...matches];
    }
    return matches;
  }, [leadOptions, leadFilter, leadId]);

  function handleSave() {
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!leadId) {
      setError("Pick an opportunity for this appointment.");
      return;
    }
    // Compose the timestamp in the browser so the stored instant matches the
    // user's local wall-clock choice, whatever timezone the server runs in.
    const when = new Date(`${date}T${time || "09:00"}`);
    if (!date || Number.isNaN(when.getTime())) {
      setError("Pick a valid date and time.");
      return;
    }

    startTransition(async () => {
      const payload = {
        leadId,
        title,
        scheduledAt: when.toISOString(),
        notes: notes.trim() ? notes : null,
      };
      const result =
        mode === "create"
          ? await createCalendarAppointment(payload)
          : await updateCalendarAppointment(appointment!.id, {
              ...payload,
              status,
            });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!appointment) return;
    startTransition(async () => {
      const result = await deleteCalendarAppointment(appointment.id);
      setConfirmingDelete(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "New appointment" : "Edit appointment"}
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base font-semibold text-text">
            {mode === "create" ? "New appointment" : "Edit appointment"}
          </h3>
          {mode === "edit" && appointment && (
            <a
              href={`/leads/${appointment.leadId}`}
              className="text-xs text-brand-accent hover:underline"
            >
              View opportunity &rarr;
            </a>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-text-muted">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Site visit"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-text-muted">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="text-sm">
            <span className="text-text-muted">Opportunity</span>
            <input
              type="text"
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              placeholder="Search opportunities…"
              className={inputClass}
              aria-label="Search opportunities"
            />
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className={inputClass}
              aria-label="Opportunity"
            >
              <option value="">Select an opportunity…</option>
              {filteredLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" && (
            <label className="block text-sm">
              <span className="text-text-muted">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="text-text-muted">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={isPending}
              className="px-3 py-1.5 border border-red-300 text-red-600 text-sm font-semibold rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-1.5 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : mode === "create"
                  ? "Create appointment"
                  : "Save changes"}
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmingDelete}
          title="Delete appointment"
          message="Delete this appointment? This can't be undone."
          confirmLabel="Delete appointment"
          busy={isPending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      </div>
    </div>
  );
}
