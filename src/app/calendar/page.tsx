import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MonthCalendar, {
  type CalendarAppointment,
} from "@/components/calendar/MonthCalendar";

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
  lead_id: string;
  leads: { title: string | null } | null;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const { ym } = await searchParams;
  const { year, month } = parseYm(ym);

  // Fetch appointments that start within the visible range:
  // 6 weeks rendered, so widen by a few days on each side.
  const start = new Date(year, month, 1);
  start.setDate(start.getDate() - 7);
  const end = new Date(year, month + 1, 1);
  end.setDate(end.getDate() + 7);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("lead_appointments")
    .select("id, title, scheduled_at, status, lead_id, leads ( title )")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at")
    .returns<Row[]>();

  const appointments: CalendarAppointment[] = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    scheduledAt: r.scheduled_at,
    status: r.status,
    leadId: r.lead_id,
    leadTitle: r.leads?.title ?? null,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AppNav current="calendar" />
      <h2 className="text-2xl font-semibold mb-6">Calendar</h2>
      <MonthCalendar
        year={year}
        month={month}
        appointments={appointments}
      />
    </main>
  );
}
