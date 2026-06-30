"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function trim(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function cents(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[^0-9.-]/g, "").trim();
  if (!clean) return null;
  const n = Number(clean);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

// =============================================================================
// Tasks
// =============================================================================

export async function addTask(leadId: string, formData: FormData) {
  const title = trim(formData.get("title"));
  if (!title) throw new Error("Task title required");
  const due = trim(formData.get("due_date"));
  const assignedTo = trim(formData.get("assigned_to_profile_id"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_tasks").insert({
    lead_id: leadId,
    title,
    due_date: due,
    assigned_to_profile_id: assignedTo,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
}

export async function toggleTask(leadId: string, taskId: string, completed: boolean) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_tasks")
    .update({ completed: !completed })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteTask(leadId: string, taskId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Notes
// =============================================================================

export async function addNote(leadId: string, formData: FormData) {
  const body = trim(formData.get("body"));
  if (!body) throw new Error("Note body required");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, author_profile_id: user?.id ?? null, body });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteNote(leadId: string, noteId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function updateNote(leadId: string, noteId: string, formData: FormData) {
  const body = trim(formData.get("body"));
  if (!body) throw new Error("Note body required");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_notes")
    .update({ body })
    .eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Appointments
// =============================================================================

export async function addAppointment(leadId: string, formData: FormData) {
  const title = trim(formData.get("title"));
  const scheduledAt = trim(formData.get("scheduled_at"));
  if (!title || !scheduledAt)
    throw new Error("Appointment title and time required");
  const notes = trim(formData.get("notes"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_appointments").insert({
    lead_id: leadId,
    title,
    scheduled_at: scheduledAt,
    notes,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function updateAppointmentStatus(
  leadId: string,
  appointmentId: string,
  status: string,
) {
  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    throw new Error("Invalid appointment status");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_appointments")
    .update({ status })
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteAppointment(leadId: string, appointmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Payments
// =============================================================================

export async function addPayment(leadId: string, formData: FormData) {
  const amount = cents(formData.get("amount_cents"));
  if (amount === null) throw new Error("Valid amount required");
  const description = trim(formData.get("description"));
  const status = (formData.get("status") as string) || "received";
  const recordedAt = trim(formData.get("recorded_at"));
  const paymentMethod = trim(formData.get("payment_method"));
  const reference = trim(formData.get("reference"));

  const supabase = await createSupabaseServerClient();
  const row: Record<string, unknown> = {
    lead_id: leadId,
    amount_cents: amount,
    description,
    status,
    payment_method: paymentMethod,
    reference,
  };
  if (recordedAt) row.recorded_at = recordedAt;

  const { error } = await supabase.from("lead_payments").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function deletePayment(leadId: string, paymentId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_payments")
    .delete()
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Followers (many-to-many with profiles)
// =============================================================================

export async function toggleFollower(
  leadId: string,
  profileId: string,
  isFollowing: boolean,
) {
  const supabase = await createSupabaseServerClient();
  if (isFollowing) {
    const { error } = await supabase
      .from("lead_followers")
      .delete()
      .eq("lead_id", leadId)
      .eq("profile_id", profileId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("lead_followers")
      .insert({ lead_id: leadId, profile_id: profileId });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Additional Contacts (many-to-many with contacts)
// =============================================================================

export async function addAdditionalContact(leadId: string, formData: FormData) {
  const contactId = trim(formData.get("contact_id"));
  if (!contactId) throw new Error("Contact required");
  const relationship = trim(formData.get("relationship"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_additional_contacts")
    .insert({ lead_id: leadId, contact_id: contactId, relationship });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function removeAdditionalContact(
  leadId: string,
  contactId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lead_additional_contacts")
    .delete()
    .eq("lead_id", leadId)
    .eq("contact_id", contactId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

// =============================================================================
// Documents (Supabase Storage: lead-documents bucket + lead_attachments table)
// =============================================================================

const LEAD_DOCS_BUCKET = "lead-documents";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export async function uploadLeadAttachment(leadId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Look up the lead's primary contact so the attachment can be associated.
  const { data: lead } = await supabase
    .from("leads")
    .select("contact_id")
    .eq("id", leadId)
    .maybeSingle();

  const path = `${leadId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const { error: uploadErr } = await supabase.storage
    .from(LEAD_DOCS_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) throw new Error(uploadErr.message);

  const { error: rowErr } = await supabase.from("lead_attachments").insert({
    lead_id: leadId,
    contact_id: lead?.contact_id ?? null,
    bucket: LEAD_DOCS_BUCKET,
    path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user.id,
  });
  if (rowErr) {
    // Roll back the orphaned object so storage and the table stay in sync.
    await supabase.storage.from(LEAD_DOCS_BUCKET).remove([path]);
    throw new Error(rowErr.message);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadAttachment(
  leadId: string,
  attachmentId: string,
) {
  const supabase = await createSupabaseServerClient();

  const { data: row, error: fetchErr } = await supabase
    .from("lead_attachments")
    .select("bucket, path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) return;

  const { error: storageErr } = await supabase.storage
    .from(row.bucket)
    .remove([row.path]);
  if (storageErr) throw new Error(storageErr.message);

  const { error: rowErr } = await supabase
    .from("lead_attachments")
    .delete()
    .eq("id", attachmentId);
  if (rowErr) throw new Error(rowErr.message);

  revalidatePath(`/leads/${leadId}`);
}
