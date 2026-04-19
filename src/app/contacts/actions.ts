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

  const { data, error } = await supabase
    .from("contacts")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
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
