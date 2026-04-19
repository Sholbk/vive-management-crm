import type { SupabaseClient } from "@supabase/supabase-js";
import { STAGES, type Stage } from "@/app/leads/types";

export type StageLabelMap = Record<Stage, string>;

const FALLBACKS: StageLabelMap = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  showing: "Showing",
  offer: "Offer",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export async function getStageLabels(
  supabase: SupabaseClient,
): Promise<StageLabelMap> {
  const { data, error } = await supabase
    .from("stage_labels")
    .select("stage_key, display_name");

  if (error || !data) return { ...FALLBACKS };

  const result = { ...FALLBACKS };
  for (const row of data) {
    if ((STAGES as readonly string[]).includes(row.stage_key)) {
      result[row.stage_key as Stage] = row.display_name;
    }
  }
  return result;
}
