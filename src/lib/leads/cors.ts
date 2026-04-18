// CORS allow-list for public lead intake. Comma-separated origins in env.
// e.g. LEAD_INTAKE_ALLOWED_ORIGINS="https://lomadelmar.com,https://siteb.com"

function parseAllowedOrigins(): string[] {
  const raw = process.env.LEAD_INTAKE_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const allowed = parseAllowedOrigins();
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
