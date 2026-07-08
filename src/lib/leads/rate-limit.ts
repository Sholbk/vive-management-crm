import type { SupabaseClient } from "@supabase/supabase-js";

// Wraps the consume_rate_limit Postgres function (fixed-window counters in
// api_rate_limits). Fails open: a rate-limiter outage must not drop real leads.
export async function consumeRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("Rate limit check failed", error);
    return true;
  }
  return data === true;
}
