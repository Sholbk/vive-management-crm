"use server";

import { revalidatePath } from "next/cache";
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
