import { z } from "zod";

export const leadTimelineSchema = z.enum([
  "0_3mo",
  "3_6mo",
  "6_12mo",
  "12mo_plus",
  "unknown",
]);

export const leadFinancingSchema = z.enum([
  "cash",
  "pre_approved",
  "needs_financing",
  "unknown",
]);

export const leadSourceSchema = z.enum([
  "website_form",
  "referral",
  "ad",
  "walk_in",
  "phone",
  "other",
]);

export const leadPayloadSchema = z.object({
  developmentSlug: z.string().min(1).max(64),
  lotExternalId: z.string().max(64).optional(),

  firstName: z.string().min(1).max(120),
  lastName: z.string().max(120).optional().default(""),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),

  budgetMinCents: z.number().int().nonnegative().optional(),
  budgetMaxCents: z.number().int().nonnegative().optional(),
  timeline: leadTimelineSchema.optional(),
  financing: leadFinancingSchema.optional(),

  source: leadSourceSchema.default("website_form"),
  utm: z
    .object({
      source: z.string().max(255).optional(),
      medium: z.string().max(255).optional(),
      campaign: z.string().max(255).optional(),
      term: z.string().max(255).optional(),
      content: z.string().max(255).optional(),
    })
    .optional(),
  referrerUrl: z.string().url().max(2048).optional(),
  landingPage: z.string().max(2048).optional(),

  turnstileToken: z.string().min(1),
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;
