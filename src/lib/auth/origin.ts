import { headers } from "next/headers";

/**
 * Absolute origin to build auth email links against.
 *
 * Prefers NEXT_PUBLIC_CRM_URL; falls back to the request host so preview
 * deploys and localhost still produce clickable links. The trailing slash is
 * stripped: a Supabase Site URL with one once produced `…mx//auth/callback`,
 * whose `//` dodged the proxy's auth bypass and bounced users to /login.
 */
export async function resolveOrigin(): Promise<string> {
  const envOrigin = process.env.NEXT_PUBLIC_CRM_URL?.trim();
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "";
}
