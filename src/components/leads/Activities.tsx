import {
  addTask,
  toggleTask,
  deleteTask,
  addNote,
  deleteNote,
  addAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  addPayment,
  deletePayment,
  toggleFollower,
  addAdditionalContact,
  removeAdditionalContact,
} from "@/app/leads/[id]/actions";
import NoteItem from "./NoteItem";

export interface LeadTask {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  assigned_to_profile_id: string | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  body: string;
  created_at: string;
  author_profile_id: string | null;
}

export interface LeadActivity {
  id: string;
  type: string;
  body: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export interface LeadAppointment {
  id: string;
  title: string;
  scheduled_at: string;
  notes: string | null;
  status: string;
}

export interface LeadPayment {
  id: string;
  amount_cents: number;
  description: string | null;
  status: string;
  recorded_at: string;
  payment_method: string | null;
  reference: string | null;
}

export interface LeadAdditionalContact {
  id: string;
  label: string;
  email: string | null;
  relationship: string | null;
}

export interface ProfileOption {
  id: string;
  label: string;
  role: string;
}

export interface ContactOption {
  id: string;
  label: string;
  email: string | null;
}

const RELATIONSHIPS = ["spouse", "partner", "parent", "child", "sibling", "other"];

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (completed || !dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

const inputCls =
  "px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent";
const btnPrimary =
  "px-3 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90";

// =============================================================================
// Tasks
// =============================================================================

function TasksSection({
  leadId,
  tasks,
  profiles,
}: {
  leadId: string;
  tasks: LeadTask[];
  profiles: ProfileOption[];
}) {
  const profileMap = new Map(profiles.map((p) => [p.id, p.label]));
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Tasks</h3>

      <form
        action={addTask.bind(null, leadId)}
        className="grid sm:grid-cols-[1fr_140px_200px_auto] gap-2 mb-4 items-start"
      >
        <input
          name="title"
          placeholder="New task"
          required
          className={inputCls}
        />
        <input name="due_date" type="date" className={inputCls} />
        <select
          name="assigned_to_profile_id"
          defaultValue=""
          className={inputCls}
        >
          <option value="">Unassigned</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-text-muted">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const toggle = toggleTask.bind(null, leadId, t.id, t.completed);
            const remove = deleteTask.bind(null, leadId, t.id);
            const overdue = isOverdue(t.due_date, t.completed);
            const assignee = t.assigned_to_profile_id
              ? profileMap.get(t.assigned_to_profile_id)
              : null;
            return (
              <li
                key={t.id}
                className={`flex items-center gap-3 py-1.5 border-b border-border last:border-0 ${
                  overdue ? "bg-red-50 rounded -mx-2 px-2" : ""
                }`}
              >
                <form action={toggle}>
                  <button
                    type="submit"
                    className={`w-4 h-4 rounded border ${
                      t.completed
                        ? "bg-brand-accent border-brand-accent"
                        : "border-border"
                    }`}
                    aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                  />
                </form>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      t.completed ? "line-through text-text-muted" : "text-text"
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {t.due_date && (
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>
                        Due {fmtDate(t.due_date)}
                        {overdue ? " • Overdue" : ""}
                      </span>
                    )}
                    {assignee && <span>• {assignee}</span>}
                  </div>
                </div>
                <form action={remove}>
                  <button
                    type="submit"
                    className="text-xs text-text-muted hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Notes (merged timeline: manual notes + system activities)
// =============================================================================

function NotesSection({
  leadId,
  notes,
  activities,
}: {
  leadId: string;
  notes: LeadNote[];
  activities: LeadActivity[];
}) {
  type TimelineItem =
    | {
        kind: "note";
        id: string;
        body: string;
        occurredAt: string;
      }
    | {
        kind: "activity";
        id: string;
        type: string;
        body: string | null;
        metadata: Record<string, unknown>;
        occurredAt: string;
      };

  const timeline: TimelineItem[] = [
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id,
      body: n.body,
      occurredAt: n.created_at,
    })),
    ...activities.map((a) => ({
      kind: "activity" as const,
      id: a.id,
      type: a.type,
      body: a.body,
      metadata: a.metadata,
      occurredAt: a.occurred_at,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Notes &amp; Timeline</h3>

      <form
        action={addNote.bind(null, leadId)}
        className="mb-4 flex flex-col gap-2"
      >
        <textarea
          name="body"
          placeholder="Add a note..."
          rows={2}
          required
          className={inputCls}
        />
        <button type="submit" className={`${btnPrimary} self-start`}>
          Add note
        </button>
      </form>

      {timeline.length === 0 ? (
        <p className="text-sm text-text-muted">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {timeline.map((item) => {
            if (item.kind === "note") {
              return (
                <NoteItem
                  key={`n-${item.id}`}
                  leadId={leadId}
                  noteId={item.id}
                  body={item.body}
                  createdAt={item.occurredAt}
                  deleteAction={deleteNote.bind(null, leadId, item.id)}
                />
              );
            }
            const m = item.metadata ?? {};
            const fromStage =
              typeof m.from === "string" ? (m.from as string) : null;
            const toStage =
              typeof m.to === "string" ? (m.to as string) : null;
            const label =
              item.type === "stage_change"
                ? `Stage changed ${fromStage ? `from ${fromStage} ` : ""}to ${
                    toStage ?? "—"
                  }`
                : item.type === "assignment"
                  ? "Assignment changed"
                  : `${item.type}${item.body ? `: ${item.body}` : ""}`;
            return (
              <li
                key={`a-${item.id}`}
                className="border-l-2 border-text-muted pl-3 py-1 opacity-80"
              >
                <p className="text-sm italic text-text-muted">{label}</p>
                <span className="text-xs text-text-muted">
                  {fmtDateTime(item.occurredAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Appointments
// =============================================================================

function AppointmentsSection({
  leadId,
  appointments,
}: {
  leadId: string;
  appointments: LeadAppointment[];
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Appointments</h3>

      <form
        action={addAppointment.bind(null, leadId)}
        className="grid sm:grid-cols-2 gap-2 mb-4"
      >
        <input
          name="title"
          placeholder="e.g. Property tour"
          required
          className={inputCls}
        />
        <input
          name="scheduled_at"
          type="datetime-local"
          required
          className={inputCls}
        />
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          rows={2}
          className={`${inputCls} sm:col-span-2`}
        />
        <button type="submit" className={`${btnPrimary} sm:col-span-2 self-start`}>
          Schedule
        </button>
      </form>

      {appointments.length === 0 ? (
        <p className="text-sm text-text-muted">No appointments scheduled.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => {
            const remove = deleteAppointment.bind(null, leadId, a.id);
            const markDone = updateAppointmentStatus.bind(
              null,
              leadId,
              a.id,
              "completed",
            );
            const markCancel = updateAppointmentStatus.bind(
              null,
              leadId,
              a.id,
              "cancelled",
            );
            return (
              <li
                key={a.id}
                className="border-b border-border pb-2 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{a.title}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : a.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {fmtDateTime(a.scheduled_at)}
                </p>
                {a.notes && (
                  <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">
                    {a.notes}
                  </p>
                )}
                {a.status === "scheduled" && (
                  <div className="flex gap-2 mt-1">
                    <form action={markDone} className="inline">
                      <button
                        type="submit"
                        className="text-xs text-green-700 hover:underline"
                      >
                        Mark complete
                      </button>
                    </form>
                    <form action={markCancel} className="inline">
                      <button
                        type="submit"
                        className="text-xs text-text-muted hover:text-red-600"
                      >
                        Cancel
                      </button>
                    </form>
                    <form action={remove} className="inline">
                      <button
                        type="submit"
                        className="text-xs text-text-muted hover:text-red-600"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Payments
// =============================================================================

function PaymentsSection({
  leadId,
  payments,
}: {
  leadId: string;
  payments: LeadPayment[];
}) {
  const total = payments
    .filter((p) => p.status === "received")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Payments</h3>
        {total > 0 && (
          <span className="text-sm text-text-muted">
            Received: <strong className="text-text">{formatMoney(total)}</strong>
          </span>
        )}
      </div>

      <form
        action={addPayment.bind(null, leadId)}
        className="grid sm:grid-cols-[1fr_1fr_140px_140px] gap-2 mb-2 items-start"
      >
        <input
          name="amount_cents"
          type="text"
          inputMode="decimal"
          placeholder="Amount $"
          required
          className={inputCls}
        />
        <input
          name="description"
          placeholder="Description"
          className={inputCls}
        />
        <select name="payment_method" defaultValue="" className={inputCls}>
          <option value="">Method</option>
          <option value="cash">Cash</option>
          <option value="check">Check</option>
          <option value="card">Card</option>
          <option value="wire">Wire</option>
          <option value="other">Other</option>
        </select>
        <input
          name="reference"
          placeholder="Reference # (optional)"
          className={inputCls}
        />
        <select name="status" defaultValue="received" className={inputCls}>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <input name="recorded_at" type="date" className={inputCls} />
        <button type="submit" className={`${btnPrimary} sm:col-span-2`}>
          Add payment
        </button>
      </form>

      {payments.length === 0 ? (
        <p className="text-sm text-text-muted">No payments recorded.</p>
      ) : (
        <ul className="space-y-2 mt-4">
          {payments.map((p) => {
            const remove = deletePayment.bind(null, leadId, p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0"
              >
                <span className="font-semibold w-24">
                  {formatMoney(p.amount_cents)}
                </span>
                <span className="flex-1 text-text-muted">
                  {p.description ?? "—"}
                  {p.reference && (
                    <span className="text-xs ml-1 font-mono">({p.reference})</span>
                  )}
                </span>
                {p.payment_method && (
                  <span className="text-xs text-text-muted capitalize">
                    {p.payment_method}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    p.status === "received"
                      ? "bg-green-100 text-green-800"
                      : p.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {p.status}
                </span>
                <span className="text-xs text-text-muted">
                  {fmtDate(p.recorded_at)}
                </span>
                <form action={remove} className="inline">
                  <button
                    type="submit"
                    className="text-xs text-text-muted hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Followers
// =============================================================================

function FollowersSection({
  leadId,
  allProfiles,
  followerIds,
}: {
  leadId: string;
  allProfiles: ProfileOption[];
  followerIds: string[];
}) {
  const followerSet = new Set(followerIds);
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-1">Followers</h3>
      <p className="text-sm text-text-muted mb-3">
        People who want updates on this lead. Owners are auto-followed.
      </p>
      <div className="flex flex-wrap gap-2">
        {allProfiles.map((p) => {
          const isFollowing = followerSet.has(p.id);
          const toggle = toggleFollower.bind(null, leadId, p.id, isFollowing);
          return (
            <form action={toggle} key={p.id} className="inline">
              <button
                type="submit"
                className={`px-3 py-1 rounded-full text-xs border ${
                  isFollowing
                    ? "bg-brand-accent text-white border-brand-accent"
                    : "bg-white text-text-muted border-border hover:bg-surface-muted"
                }`}
              >
                {p.label} {p.role === "admin" ? "(Admin)" : ""}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// Additional Contacts
// =============================================================================

function AdditionalContactsSection({
  leadId,
  linked,
  allContacts,
  primaryContactId,
}: {
  leadId: string;
  linked: LeadAdditionalContact[];
  allContacts: ContactOption[];
  primaryContactId: string | null;
}) {
  const linkedIds = new Set(linked.map((c) => c.id));
  const available = allContacts.filter(
    (c) => !linkedIds.has(c.id) && c.id !== primaryContactId,
  );

  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-1">Additional Contacts</h3>
      <p className="text-sm text-text-muted mb-3">
        Spouses, family members, or other people tied to this deal.
      </p>

      <form
        action={addAdditionalContact.bind(null, leadId)}
        className="grid sm:grid-cols-[1fr_160px_auto] gap-2 mb-4"
      >
        <select name="contact_id" required className={inputCls}>
          <option value="">— Select a contact —</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} {c.email ? `(${c.email})` : ""}
            </option>
          ))}
        </select>
        <select name="relationship" defaultValue="" className={inputCls}>
          <option value="">Relationship</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>

      {linked.length === 0 ? (
        <p className="text-sm text-text-muted">No additional contacts.</p>
      ) : (
        <ul className="space-y-2">
          {linked.map((c) => {
            const remove = removeAdditionalContact.bind(null, leadId, c.id);
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0"
              >
                <a
                  href={`/contacts/${c.id}`}
                  className="flex-1 text-brand-accent hover:underline"
                >
                  {c.label}
                </a>
                {c.relationship && (
                  <span className="text-xs text-text-muted capitalize">
                    {c.relationship}
                  </span>
                )}
                {c.email && (
                  <span className="text-xs text-text-muted">{c.email}</span>
                )}
                <form action={remove} className="inline">
                  <button
                    type="submit"
                    className="text-xs text-text-muted hover:text-red-600"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Umbrella component
// =============================================================================

export default function Activities({
  leadId,
  tasks,
  notes,
  activities,
  appointments,
  payments,
  allProfiles,
  followerIds,
  linkedContacts,
  allContacts,
  primaryContactId,
}: {
  leadId: string;
  tasks: LeadTask[];
  notes: LeadNote[];
  activities: LeadActivity[];
  appointments: LeadAppointment[];
  payments: LeadPayment[];
  allProfiles: ProfileOption[];
  followerIds: string[];
  linkedContacts: LeadAdditionalContact[];
  allContacts: ContactOption[];
  primaryContactId: string | null;
}) {
  return (
    <div className="space-y-4">
      <TasksSection leadId={leadId} tasks={tasks} profiles={allProfiles} />
      <NotesSection leadId={leadId} notes={notes} activities={activities} />
      <AppointmentsSection leadId={leadId} appointments={appointments} />
      <PaymentsSection leadId={leadId} payments={payments} />
      <FollowersSection
        leadId={leadId}
        allProfiles={allProfiles}
        followerIds={followerIds}
      />
      <AdditionalContactsSection
        leadId={leadId}
        linked={linkedContacts}
        allContacts={allContacts}
        primaryContactId={primaryContactId}
      />
    </div>
  );
}
