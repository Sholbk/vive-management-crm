import { createSupabaseServerClient } from "@/lib/supabase/server";
import LeadsBoard, {
  type BoardLead,
  type Development,
} from "@/components/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const params = await searchParams;
  const selected = params.pipeline ?? "all";

  const supabase = await createSupabaseServerClient();

  const { data: developments } = await supabase
    .from("developments")
    .select("id, slug, name")
    .eq("active", true)
    .order("name")
    .returns<Development[]>();

  let query = supabase
    .from("leads")
    .select(
      `id, first_name, last_name, email, phone, stage, source, budget_max_cents, created_at, development_id,
       developments ( name, slug )`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (selected !== "all") {
    const match = developments?.find((d) => d.slug === selected);
    if (match) query = query.eq("development_id", match.id);
  }

  const { data: leads, error } = await query.returns<BoardLead[]>();

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-text-muted hover:text-text"
          >
            Sign out
          </button>
        </form>
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Error loading leads: {error.message}
        </div>
      )}

      <LeadsBoard
        leads={leads ?? []}
        developments={developments ?? []}
        selectedDevelopment={selected}
      />
    </main>
  );
}
