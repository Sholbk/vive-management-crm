import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MonthCalendar, {
  type CalendarAppointment,
} from "@/components/calendar/MonthCalendar";
import type { LeadOption } from "@/components/calendar/AppointmentDialog";

export const dynamic = "force-dynamic";

function parseYm(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map((s) => parseInt(s, 10));
    return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

type Row = {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  lead_id: string;
  leads: { title: string | null } | null;
};

type LeadRow = {
  id: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
};

const APPT_SELECT =
  "id, title, scheduled_at, status, notes, lead_id, leads ( title )";

function toAppointment(r: Row): CalendarAppointment {
  return {
    id: r.id,
    title: r.title,
    scheduledAt: r.scheduled_at,
    status: r.status,
    notes: r.notes,
    leadId: r.lead_id,
    leadTitle: r.leads?.title ?? null,
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string; appt?: string }>;
}) {
  const { ym, appt } = await searchParams;
  const { year, month } = parseYm(ym);

  // Fetch appointments that fall within the visible 6x7 grid: it starts on
  // the Sunday on or before the 1st and spans 42 days. Widen by one day on
  // each side so viewer-timezone day bucketing (done in the browser) can't
  // miss an appointment near the grid edges. Anything fetched that lands
  // outside the grid simply isn't rendered or counted.
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay() - 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 42 + 2);

  const supabase = await createSupabaseServerClient();

  // The sidebar is month-independent: everything from now forward plus the
  // most recent past appointments (last 90 days), so it's never empty while
  // any appointment exists in a reasonable window.
  const nowIso = new Date().toISOString();
  const past90Iso = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const [gridResult, upcomingResult, pastResult, leadsResult] =
    await Promise.all([
      supabase
        .from("lead_appointments")
        .select(APPT_SELECT)
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString())
        .order("scheduled_at")
        .returns<Row[]>(),
      supabase
        .from("lead_appointments")
        .select(APPT_SELECT)
        .gte("scheduled_at", nowIso)
        .order("scheduled_at")
        .limit(25)
        .returns<Row[]>(),
      supabase
        .from("lead_appointments")
        .select(APPT_SELECT)
        .gte("scheduled_at", past90Iso)
        .lt("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: false })
        .limit(10)
        .returns<Row[]>(),
      supabase
        .from("leads")
        .select("id, title, first_name, last_name")
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<LeadRow[]>(),
    ]);

  const appointments = (gridResult.data ?? []).map(toAppointment);
  const upcoming = (upcomingResult.data ?? []).map(toAppointment);
  const past = (pastResult.data ?? []).map(toAppointment);

  const leadOptions: LeadOption[] = (leadsResult.data ?? []).map((l) => ({
    id: l.id,
    label:
      l.title?.trim() ||
      [l.first_name, l.last_name].filter(Boolean).join(" ") ||
      "Untitled opportunity",
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AppNav current="calendar" />
      <h2 className="text-2xl font-semibold mb-6">Calendar</h2>
      <MonthCalendar
        year={year}
        month={month}
        appointments={appointments}
        upcoming={upcoming}
        past={past}
        leadOptions={leadOptions}
        initialApptId={appt}
      />
    </main>
  );
}
