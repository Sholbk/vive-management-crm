"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STAGES, type Stage } from "./types";

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export async function updateLeadStage(leadId: string, newStage: string) {
  if (!isStage(newStage)) throw new Error(`Invalid stage: ${newStage}`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ stage: newStage })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

async function ensureFollower(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string,
  profileId: string | null,
) {
  if (!profileId) return;
  // Upsert-ish insert; ignore duplicate-key errors so repeated assigns don't fail.
  const { error } = await supabase
    .from("lead_followers")
    .insert({ lead_id: leadId, profile_id: profileId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    console.error("Failed to auto-follow on assign", error);
  }
}

export async function assignLead(leadId: string, agentId: string | null) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ assigned_agent_id: agentId })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  await ensureFollower(supabase, leadId, agentId);

  revalidatePath("/leads");
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function parseCents(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[^0-9.]/g, "").trim();
  if (!clean) return null;
  const dollars = Number(clean);
  if (Number.isNaN(dollars)) return null;
  return Math.round(dollars * 100);
}

function parseTags(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string") return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function updateLead(leadId: string, formData: FormData) {
  const rawStage = (formData.get("stage") as string) || "new";
  if (!isStage(rawStage)) throw new Error(`Invalid stage: ${rawStage}`);

  const rawStatus = (formData.get("status") as string) || "open";
  const validStatus = ["open", "archived", "duplicate"].includes(rawStatus)
    ? rawStatus
    : "open";

  const developmentId = trimOrNull(formData.get("development_id"));
  if (!developmentId) throw new Error("Development is required");

  // Primary dev is excluded from the additional list to keep the mental
  // model clean (a lead isn't "also interested in" their primary pipeline).
  const additionalDevelopmentIds = formData
    .getAll("additional_development_ids")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .filter((v) => v !== developmentId);

  const row = {
    title: trimOrNull(formData.get("title")),
    business_name: trimOrNull(formData.get("business_name")),
    tags: parseTags(formData.get("tags")),
    notes: trimOrNull(formData.get("notes")),
    stage: rawStage,
    status: validStatus,
    budget_max_cents: parseCents(formData.get("budget_max_cents")),
    assigned_agent_id: trimOrNull(formData.get("assigned_agent_id")),
    source: (formData.get("source") as string) || "other",
    development_id: developmentId,
    additional_development_ids: additionalDevelopmentIds,
  };

  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("leads")
    .update(row)
    .eq("id", leadId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error(
      "Lead was not updated. Your account may not have permission to edit this lead.",
    );
  }

  await ensureFollower(supabase, leadId, row.assigned_agent_id);

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}?saved=1`);
}
