const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { outcome: "pass" }
  | { outcome: "skipped" }
  | { outcome: "fail"; errorCodes: string[] };

// Verifies a Cloudflare Turnstile token. Enforcement is opt-in: with no
// TURNSTILE_SECRET_KEY configured every token is accepted, so the marketing
// sites can keep sending their placeholder token until the widget ships.
// A siteverify network failure also passes — losing a real lead costs more
// than letting one bot submission through.
export async function verifyTurnstileToken(
  token: string,
  remoteIp: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { outcome: "skipped" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    if (!res.ok) throw new Error(`siteverify responded ${res.status}`);
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (data.success) return { outcome: "pass" };
    return { outcome: "fail", errorCodes: data["error-codes"] ?? [] };
  } catch (err) {
    console.error("Turnstile verification errored", err);
    return { outcome: "pass" };
  }
}
