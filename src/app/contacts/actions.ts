"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTACT_TYPES, type ContactType } from "./types";

function isContactType(v: string): v is ContactType {
  return (CONTACT_TYPES as readonly string[]).includes(v);
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function createContact(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const email = trimOrNull(formData.get("email"));
  const typeRaw = (formData.get("contact_type") as string) || "lead";
  const contact_type = isContactType(typeRaw) ? typeRaw : "lead";
  const developmentId = trimOrNull(formData.get("development_id"));

  // A Lead-type contact must be in a development so it can land in that
  // development's pipeline. Other types don't need one.
  if (contact_type === "lead" && !developmentId) {
    throw new Error(
      "Lead-type contacts need a development so they can appear in the pipeline",
    );
  }

  const row = {
    first_name: trimOrNull(formData.get("first_name")),
    last_name: trimOrNull(formData.get("last_name")),
    email,
    phone: trimOrNull(formData.get("phone")),
    date_of_birth: trimOrNull(formData.get("date_of_birth")),
    contact_source: trimOrNull(formData.get("contact_source")),
    contact_type,
    notes: trimOrNull(formData.get("notes")),
  };

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // For Lead-type contacts, also create a pipeline entry so they show up
  // in the Kanban. For other types, we only create the contact.
  if (contact_type === "lead" && developmentId) {
    const { error: leadErr } = await supabase.from("leads").insert({
      development_id: developmentId,
      contact_id: contact.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      stage: "new",
      source: "other",
      status: "open",
    });
    if (leadErr) throw new Error(leadErr.message);
    revalidatePath("/leads");
  }

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const typeRaw = (formData.get("contact_type") as string) || "lead";
  const contact_type = isContactType(typeRaw) ? typeRaw : "lead";

  const row = {
    first_name: trimOrNull(formData.get("first_name")),
    last_name: trimOrNull(formData.get("last_name")),
    email: trimOrNull(formData.get("email")),
    phone: trimOrNull(formData.get("phone")),
    date_of_birth: trimOrNull(formData.get("date_of_birth")),
    contact_source: trimOrNull(formData.get("contact_source")),
    contact_type,
    notes: trimOrNull(formData.get("notes")),
  };

  const { error } = await supabase
    .from("contacts")
    .update(row)
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}
