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

export interface LeadTask {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

export interface LeadNote {
  id: string;
  body: string;
  created_at: string;
  author_profile_id: string | null;
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
}: {
  leadId: string;
  tasks: LeadTask[];
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Tasks</h3>

      <form
        action={addTask.bind(null, leadId)}
        className="flex flex-wrap gap-2 mb-4"
      >
        <input
          name="title"
          placeholder="New task"
          required
          className={`${inputCls} flex-1 min-w-40`}
        />
        <input name="due_date" type="date" className={inputCls} />
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
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 py-1.5 border-b border-border last:border-0"
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
                  {t.due_date && (
                    <p className="text-xs text-text-muted">
                      Due {fmtDate(t.due_date)}
                    </p>
                  )}
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
// Notes
// =============================================================================

function NotesSection({
  leadId,
  notes,
}: {
  leadId: string;
  notes: LeadNote[];
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Notes timeline</h3>

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

      {notes.length === 0 ? (
        <p className="text-sm text-text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => {
            const remove = deleteNote.bind(null, leadId, n.id);
            return (
              <li
                key={n.id}
                className="border-l-2 border-brand-accent pl-3 py-1"
              >
                <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted">
                    {fmtDateTime(n.created_at)}
                  </span>
                  <form action={remove} className="inline">
                    <button
                      type="submit"
                      className="text-xs text-text-muted hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
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
        className="grid sm:grid-cols-[1fr_1fr_140px_140px_auto] gap-2 mb-4 items-start"
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
        <select name="status" defaultValue="received" className={inputCls}>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <input name="recorded_at" type="date" className={inputCls} />
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>

      {payments.length === 0 ? (
        <p className="text-sm text-text-muted">No payments recorded.</p>
      ) : (
        <ul className="space-y-2">
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
                </span>
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
        People who want updates on this lead.
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
  linked: ContactOption[];
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
        className="flex gap-2 mb-4"
      >
        <select name="contact_id" required className={`${inputCls} flex-1`}>
          <option value="">— Select a contact —</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} {c.email ? `(${c.email})` : ""}
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
  appointments: LeadAppointment[];
  payments: LeadPayment[];
  allProfiles: ProfileOption[];
  followerIds: string[];
  linkedContacts: ContactOption[];
  allContacts: ContactOption[];
  primaryContactId: string | null;
}) {
  return (
    <div className="space-y-4">
      <TasksSection leadId={leadId} tasks={tasks} />
      <NotesSection leadId={leadId} notes={notes} />
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
