"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppointmentActionResult =
  | { ok: true }
  | { ok: false; error: string };

const STATUSES = ["scheduled", "completed", "cancelled"] as const;

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validTimestamp(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(new Date(v).getTime());
}

export async function createCalendarAppointment(input: {
  leadId: string;
  title: string;
  scheduledAt: string;
  notes: string | null;
}): Promise<AppointmentActionResult> {
  const title = trimOrNull(input.title);
  if (!title) return { ok: false, error: "A title is required." };
  if (!trimOrNull(input.leadId))
    return { ok: false, error: "Pick an opportunity for this appointment." };
  if (!validTimestamp(input.scheduledAt))
    return { ok: false, error: "Pick a valid date and time." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_appointments").insert({
    lead_id: input.leadId,
    title,
    scheduled_at: input.scheduledAt,
    notes: trimOrNull(input.notes),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  revalidatePath(`/leads/${input.leadId}`);
  return { ok: true };
}

export async function updateCalendarAppointment(
  appointmentId: string,
  input: {
    leadId: string;
    title: string;
    scheduledAt: string;
    notes: string | null;
    status: string;
  },
): Promise<AppointmentActionResult> {
  const title = trimOrNull(input.title);
  if (!title) return { ok: false, error: "A title is required." };
  if (!trimOrNull(input.leadId))
    return { ok: false, error: "Pick an opportunity for this appointment." };
  if (!validTimestamp(input.scheduledAt))
    return { ok: false, error: "Pick a valid date and time." };
  if (!(STATUSES as readonly string[]).includes(input.status))
    return { ok: false, error: "Invalid appointment status." };

  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("lead_appointments")
    .update({
      lead_id: input.leadId,
      title,
      scheduled_at: input.scheduledAt,
      notes: trimOrNull(input.notes),
      status: input.status,
    })
    .eq("id", appointmentId)
    .select("id");

  if (error) return { ok: false, error: error.message };
  // RLS currently lets any authenticated user write appointments, but if a
  // policy ever tightens, an update silently matches zero rows — report that
  // instead of pretending it saved.
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error:
        "The appointment was not updated. It may have been deleted, or your account may not have permission.",
    };
  }

  revalidatePath("/calendar");
  revalidatePath(`/leads/${input.leadId}`);
  return { ok: true };
}

export async function deleteCalendarAppointment(
  appointmentId: string,
): Promise<AppointmentActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: deleted, error } = await supabase
    .from("lead_appointments")
    .delete()
    .eq("id", appointmentId)
    .select("id, lead_id");

  if (error) return { ok: false, error: error.message };
  if (!deleted || deleted.length === 0) {
    return {
      ok: false,
      error:
        "The appointment was not deleted. It may already be gone, or your account may not have permission.",
    };
  }

  revalidatePath("/calendar");
  revalidatePath(`/leads/${deleted[0].lead_id}`);
  return { ok: true };
}
