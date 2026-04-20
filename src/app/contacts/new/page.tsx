import AppNav from "@/components/AppNav";
import ContactForm, { type DevelopmentOption } from "@/components/ContactForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createContact } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const supabase = await createSupabaseServerClient();
  const { data: developments } = await supabase
    .from("developments")
    .select("id, name")
    .eq("active", true)
    .order("name")
    .returns<DevelopmentOption[]>();

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
          developments={developments ?? []}
        />
      </div>
    </main>
  );
}
