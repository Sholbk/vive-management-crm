export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "showing",
  "offer",
  "closed_won",
  "closed_lost",
] as const;

export type Stage = (typeof STAGES)[number];
