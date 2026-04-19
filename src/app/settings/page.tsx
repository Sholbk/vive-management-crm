import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import { STAGES } from "@/app/leads/types";
import { renameStage, updateTeamMember } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  sales_agent: "Sales Agent",
  property_manager: "Property Manager",
  marketing: "Marketing",
};
const ROLES = ["admin", "sales_agent", "property_manager", "marketing"];

type StageLabelRow = { stage_key: string; display_name: string };
type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: labels }, { data: profiles }] = await Promise.all([
    supabase
      .from("stage_labels")
      .select("stage_key, display_name")
      .order("sort_order")
      .returns<StageLabelRow[]>(),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, active")
      .order("full_name", { nullsFirst: false })
      .returns<ProfileRow[]>(),
  ]);

  const labelMap = Object.fromEntries(
    (labels ?? []).map((l) => [l.stage_key, l.display_name]),
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <AppNav current="settings" />
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>

      {/* Stage labels */}
      <section className="bg-white border border-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-1">Pipeline Stage Names</h3>
        <p className="text-sm text-text-muted mb-4">
          Rename the 7 Kanban columns. Existing data isn&apos;t moved; only the
          displayed label changes.
        </p>
        <div className="space-y-3">
          {STAGES.map((stageKey) => (
            <form
              key={stageKey}
              action={renameStage}
              className="flex items-center gap-3"
            >
              <input type="hidden" name="stage_key" value={stageKey} />
              <label className="w-32 text-xs font-mono text-text-muted uppercase">
                {stageKey}
              </label>
              <input
                name="display_name"
                defaultValue={labelMap[stageKey] ?? stageKey}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
              >
                Save
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Team</h3>
          <a
            href="https://supabase.com/dashboard/project/_/auth/users"
            target="_blank"
            rel="noopener"
            className="text-sm text-brand-accent hover:underline"
          >
            + Invite new user (Supabase dashboard) &rarr;
          </a>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Invite new people via the Supabase Auth dashboard; they&apos;ll appear
          here with the default Sales Agent role. Change roles or deactivate
          below.
        </p>

        {!profiles || profiles.length === 0 ? (
          <p className="text-sm text-text-muted">No team members yet.</p>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => {
              const boundUpdate = updateTeamMember.bind(null, profile.id);
              return (
                <form
                  key={profile.id}
                  action={boundUpdate}
                  className="grid grid-cols-[1fr_1fr_160px_80px_auto] gap-3 items-center border-t border-border pt-3"
                >
                  <div>
                    <input
                      name="full_name"
                      defaultValue={profile.full_name ?? ""}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </div>
                  <div className="text-sm text-text-muted truncate">
                    {profile.email ?? "—"}
                  </div>
                  <select
                    name="role"
                    defaultValue={profile.role}
                    className="px-3 py-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={profile.active}
                    />
                    Active
                  </label>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
                  >
                    Save
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
