import AppNav from "@/components/AppNav";
import ContactForm, {
  type DevelopmentOption,
  type AgentOption,
} from "@/components/ContactForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createContact } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const supabase = await createSupabaseServerClient();
  const [devsResult, agentsResult] = await Promise.all([
    supabase
      .from("developments")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .returns<DevelopmentOption[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("active", true)
      .in("role", ["admin", "sales_agent"])
      .order("full_name", { nullsFirst: false })
      .returns<
        { id: string; full_name: string | null; email: string | null; role: string }[]
      >(),
  ]);

  const agents: AgentOption[] = (agentsResult.data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name || p.email || "Unnamed",
    role: p.role,
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <AppNav current="contacts" />
      <a
        href="/contacts"
        className="text-sm text-text-muted hover:text-text mb-4 inline-block"
      >
        &larr; Back to contacts
      </a>
      <h2 className="text-2xl font-semibold mb-6">New Contact</h2>
      <div className="bg-white border border-border rounded-lg p-6">
        <ContactForm
          action={createContact}
          submitLabel="Create Contact"
          developments={devsResult.data ?? []}
          agents={agents}
        />
      </div>
    </main>
  );
}
