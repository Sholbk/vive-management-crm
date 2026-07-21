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
    assigned_agent_id: trimOrNull(formData.get("assigned_agent_id")),
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
    assigned_agent_id: trimOrNull(formData.get("assigned_agent_id")),
  };

  const { data: updated, error } = await supabase
    .from("contacts")
    .update(row)
    .eq("id", contactId)
    .select("id");

  if (error) {
    const friendly = error.message.includes("duplicate key")
      ? "Another contact already uses that email address."
      : error.message;
    redirect(`/contacts/${contactId}?error=${encodeURIComponent(friendly)}`);
  }
  if (!updated || updated.length === 0) {
    redirect(
      `/contacts/${contactId}?error=${encodeURIComponent(
        "Contact was not updated. Your account may not have permission to edit this contact.",
      )}`,
    );
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}?saved=1`);
}

export type ContactActionResult = { ok: true } | { ok: false; error: string };

export async function addContactToPipeline(
  contactId: string,
  developmentId: string,
): Promise<ContactActionResult> {
  if (!contactId || !developmentId)
    return { ok: false, error: "Pick a development." };

  const supabase = await createSupabaseServerClient();

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone")
    .eq("id", contactId)
    .maybeSingle();
  if (contactErr) return { ok: false, error: contactErr.message };
  if (!contact) return { ok: false, error: "Contact not found." };

  const { data: existing, error: existingErr } = await supabase
    .from("leads")
    .select("id")
    .eq("contact_id", contactId)
    .eq("development_id", developmentId)
    .eq("status", "open")
    .limit(1);
  if (existingErr) return { ok: false, error: existingErr.message };
  if (existing && existing.length > 0)
    return {
      ok: false,
      error:
        "This contact already has an open pipeline entry in that development.",
    };

  const { error } = await supabase.from("leads").insert({
    development_id: developmentId,
    contact_id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    stage: "new",
    source: "other",
    status: "open",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}

export async function markContactAsClient(
  contactId: string,
): Promise<ContactActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("contacts")
    .update({ contact_type: "client" })
    .eq("id", contactId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  // RLS silent-zero guard, same as updateContact.
  if (!updated || updated.length === 0)
    return {
      ok: false,
      error:
        "The contact was not updated. Your account may not have permission.",
    };
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}

// Form-action wrappers for the server-rendered contact detail page: report
// outcomes via the page's existing ?saved= / ?error= banners.
export async function addContactToPipelineForm(
  contactId: string,
  formData: FormData,
) {
  const developmentId = trimOrNull(formData.get("development_id"));
  const result = developmentId
    ? await addContactToPipeline(contactId, developmentId)
    : { ok: false as const, error: "Pick a development." };
  redirect(
    `/contacts/${contactId}?` +
      (result.ok ? "saved=1" : `error=${encodeURIComponent(result.error)}`),
  );
}

export async function markContactAsClientForm(contactId: string) {
  const result = await markContactAsClient(contactId);
  redirect(
    `/contacts/${contactId}?` +
      (result.ok ? "saved=1" : `error=${encodeURIComponent(result.error)}`),
  );
}

export type ImportedContactRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  contact_source: string | null;
  contact_type: string | null;
  notes: string | null;
  date_of_birth: string | null;
};

export type ImportContactsResult =
  | { ok: true; inserted: number; skippedExisting: number }
  | { ok: false; error: string };

const MAX_IMPORT_ROWS = 2000;
const INSERT_CHUNK = 200;

function cleanStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function cleanDate(v: unknown): string | null {
  const s = cleanStr(v, 40);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function importContacts(
  rows: ImportedContactRow[],
): Promise<ImportContactsResult> {
  if (!Array.isArray(rows) || rows.length === 0)
    return { ok: false, error: "No rows to import." };
  if (rows.length > MAX_IMPORT_ROWS)
    return {
      ok: false,
      error: `Too many rows (${rows.length}). The limit is ${MAX_IMPORT_ROWS} per import — split the file and try again.`,
    };

  // Sanitize + drop rows with neither a name nor an email, and dedupe
  // repeated emails within the file itself.
  const seenEmails = new Set<string>();
  const cleaned: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    contact_source: string | null;
    contact_type: ContactType;
    notes: string | null;
    date_of_birth: string | null;
  }[] = [];
  for (const r of rows) {
    const typeRaw = (cleanStr(r.contact_type, 20) ?? "lead").toLowerCase();
    const row = {
      first_name: cleanStr(r.first_name, 120),
      last_name: cleanStr(r.last_name, 120),
      email: cleanStr(r.email, 254)?.toLowerCase() ?? null,
      phone: cleanStr(r.phone, 40),
      contact_source: cleanStr(r.contact_source, 120),
      contact_type: isContactType(typeRaw) ? typeRaw : ("lead" as ContactType),
      notes: cleanStr(r.notes, 2000),
      date_of_birth: cleanDate(r.date_of_birth),
    };
    if (!row.first_name && !row.last_name && !row.email) continue;
    if (row.email) {
      if (seenEmails.has(row.email)) continue;
      seenEmails.add(row.email);
    }
    cleaned.push(row);
  }
  if (cleaned.length === 0)
    return { ok: false, error: "No usable rows — every row needs at least a name or an email." };

  const supabase = await createSupabaseServerClient();

  // Skip emails that already belong to a contact instead of failing the
  // whole insert on the unique constraint.
  const emails = [...seenEmails];
  const existing = new Set<string>();
  for (let i = 0; i < emails.length; i += INSERT_CHUNK) {
    const { data, error } = await supabase
      .from("contacts")
      .select("email")
      .in("email", emails.slice(i, i + INSERT_CHUNK));
    if (error) return { ok: false, error: error.message };
    for (const c of data ?? []) {
      if (c.email) existing.add(c.email.toLowerCase());
    }
  }

  const toInsert = cleaned.filter((r) => !r.email || !existing.has(r.email));
  const skippedExisting = cleaned.length - toInsert.length;

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK);
    const { error } = await supabase.from("contacts").insert(chunk);
    if (error)
      return {
        ok: false,
        error: `Import stopped after ${inserted} contacts: ${error.message}`,
      };
    inserted += chunk.length;
  }

  revalidatePath("/contacts");
  return { ok: true, inserted, skippedExisting };
}

export type DeleteContactsResult =
  | { ok: true; deleted: number }
  | { ok: false; error: string };

export async function deleteContacts(
  contactIds: string[],
): Promise<DeleteContactsResult> {
  const ids = contactIds.filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return { ok: false, error: "No contacts selected." };

  const supabase = await createSupabaseServerClient();

  const { data: deleted, error } = await supabase
    .from("contacts")
    .delete()
    .in("id", ids)
    .select("id");

  if (error) {
    // Leads and documents unlink automatically (on delete set null), but be
    // defensive in case a future FK restricts the delete.
    const friendly =
      error.code === "23503"
        ? "This contact is linked to other records and can't be deleted."
        : error.message;
    return { ok: false, error: friendly };
  }

  // RLS makes delete admin-only (contacts_admin_all): for non-admins the
  // delete silently matches zero rows, so surface that instead of pretending
  // it worked.
  if (!deleted || deleted.length === 0) {
    return {
      ok: false,
      error:
        "No contacts were deleted. Deleting contacts requires an admin account.",
    };
  }

  revalidatePath("/contacts");
  // Deleting a contact unlinks any pipeline entries (contact_id set to null).
  revalidatePath("/leads");
  return { ok: true, deleted: deleted.length };
}
