import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import MonthCalendar, {
  type CalendarAppointment,
  type CalendarTask,
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
  leads: { title: string | null; assigned_agent_id: string | null } | null;
};

type LeadRow = {
  id: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
  lead_id: string;
  assigned_to_profile_id: string | null;
  leads: {
    title: string | null;
    first_name: string | null;
    last_name: string | null;
    assigned_agent_id: string | null;
  } | null;
};

const TASK_SELECT =
  "id, title, due_date, completed, lead_id, assigned_to_profile_id, leads ( title, first_name, last_name, assigned_agent_id )";

function leadLabel(
  lead: { title: string | null; first_name: string | null; last_name: string | null } | null,
): string | null {
  if (!lead) return null;
  return (
    lead.title?.trim() ||
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
    null
  );
}

function toTask(r: TaskRow): CalendarTask {
  return {
    id: r.id,
    title: r.title,
    dueDate: r.due_date,
    completed: r.completed,
    leadId: r.lead_id,
    leadTitle: leadLabel(r.leads),
  };
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const APPT_SELECT =
  "id, title, scheduled_at, status, notes, lead_id, leads ( title, assigned_agent_id )";

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
  searchParams: Promise<{ ym?: string; appt?: string; agent?: string }>;
}) {
  const { ym, appt, agent } = await searchParams;
  const agentId = agent || null;
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

  const [gridResult, upcomingResult, pastResult, leadsResult, gridTasksResult, openTasksResult] =
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
      // Tasks due within the visible grid. due_date is a plain date, so the
      // grid window compares as date strings — no timezone bucketing needed.
      supabase
        .from("lead_tasks")
        .select(TASK_SELECT)
        .gte("due_date", ymd(start))
        .lt("due_date", ymd(end))
        .order("due_date")
        .returns<TaskRow[]>(),
      // Sidebar: every incomplete dated task, soonest first, so overdue ones
      // stay visible whatever month the grid shows.
      supabase
        .from("lead_tasks")
        .select(TASK_SELECT)
        .eq("completed", false)
        .not("due_date", "is", null)
        .order("due_date")
        .limit(25)
        .returns<TaskRow[]>(),
    ]);

  // Agent filter, applied in JS: an appointment belongs to the agent on its
  // opportunity; a task belongs to its own assignee, falling back to the
  // opportunity's agent when unassigned.
  const apptMatches = (r: Row) =>
    !agentId || r.leads?.assigned_agent_id === agentId;
  const taskMatches = (r: TaskRow) =>
    !agentId ||
    (r.assigned_to_profile_id ?? r.leads?.assigned_agent_id) === agentId;

  const appointments = (gridResult.data ?? [])
    .filter(apptMatches)
    .map(toAppointment);
  const upcoming = (upcomingResult.data ?? [])
    .filter(apptMatches)
    .map(toAppointment);
  const past = (pastResult.data ?? []).filter(apptMatches).map(toAppointment);
  const gridTasks = (gridTasksResult.data ?? [])
    .filter(taskMatches)
    .map(toTask);
  const openTasks = (openTasksResult.data ?? [])
    .filter(taskMatches)
    .map(toTask);

  const { data: agentRows } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("active", true)
    .in("role", ["admin", "sales_agent"])
    .order("full_name", { nullsFirst: false })
    .returns<{ id: string; full_name: string | null; email: string | null }[]>();
  const agents = (agentRows ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
  }));

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
        tasks={gridTasks}
        openTasks={openTasks}
        leadOptions={leadOptions}
        agents={agents}
        agentId={agentId}
        initialApptId={appt}
      />
    </main>
  );
}
