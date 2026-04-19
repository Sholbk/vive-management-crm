export const CONTACT_TYPES = ["lead", "client", "vendor", "other"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];
