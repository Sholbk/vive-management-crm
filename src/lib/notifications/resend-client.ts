import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Lazily construct a singleton Resend client. Throws if the API key is missing
 * so callers can surface a clear ChannelResult error instead of a 500.
 */
export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  cached = new Resend(key);
  return cached;
}

/** Brand "from" address, e.g. `Vive Real Estate <leads@send.viverealestate.mx>`. */
export function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("Missing RESEND_FROM_EMAIL");
  return from;
}

/**
 * Address replies should route to (the sales team). Falls back to the first
 * configured team notification recipient when RESEND_REPLY_TO is unset.
 */
export function getReplyTo(fallback?: string | null): string | undefined {
  return process.env.RESEND_REPLY_TO || fallback || undefined;
}
