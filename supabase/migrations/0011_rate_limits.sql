-- Fixed-window request counters for rate limiting the public lead intake.
-- Only the service-role client touches this table (RLS on, no policies).

create table if not exists public.api_rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.api_rate_limits enable row level security;

-- Atomically count one request against a bucket. Returns true while the
-- bucket is within p_limit for the current window, false once exhausted.
-- The window is fixed: it resets when the stored one is older than
-- p_window_seconds.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Opportunistic cleanup so stale per-IP buckets don't accumulate.
  delete from api_rate_limits
  where bucket <> p_bucket
    and window_start < now() - interval '1 day';

  insert into api_rate_limits as rl (bucket, window_start, request_count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
    set request_count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else rl.request_count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else rl.window_start
        end
  returning rl.request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
