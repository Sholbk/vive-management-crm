-- Phase 1: Sales CRM schema
-- Scoped by development_id so adding new developments is a row insert, not a code change.
-- Phase 2 tables (tenants, leases, maintenance_tickets) reference lots and profiles already defined here.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. DEVELOPMENTS
-- ============================================================================

create table public.developments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  location text,
  timezone text default 'UTC',
  website_url text,
  active boolean not null default true,
  -- Per-development notification config, e.g.
  -- { "emails": ["sales@..."], "slack_webhook": "https://...", "sms": ["+1..."], "whatsapp": ["+1..."] }
  lead_notification_channels jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index developments_active_idx on public.developments (active) where active = true;

-- ============================================================================
-- 2. LOTS
-- ============================================================================

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  development_id uuid not null references public.developments(id) on delete restrict,
  external_id text not null, -- e.g. "A-5" from marketing site lots.ts
  title text not null,
  section text,
  type text,
  bedrooms int,
  bathrooms numeric(3,1),
  price_cents bigint,
  price_display text,
  status text not null default 'available'
    check (status in ('available','pending','sold','off_market')),
  metadata jsonb not null default '{}'::jsonb, -- features, images, map coords
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (development_id, external_id)
);

create index lots_development_status_idx on public.lots (development_id, status);

-- ============================================================================
-- 3. PROFILES (extends auth.users 1:1)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'sales_agent'
    check (role in ('admin','sales_agent','property_manager','marketing')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role) where active = true;

-- Auto-create a profile row when a new auth user is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 4. DEVELOPMENT MEMBERS (many-to-many: profile x development)
-- ============================================================================

create table public.development_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  development_id uuid not null references public.developments(id) on delete cascade,
  role_in_development text, -- optional override per development; null means inherit profiles.role
  created_at timestamptz not null default now(),
  unique (profile_id, development_id)
);

create index development_members_profile_idx on public.development_members (profile_id);
create index development_members_development_idx on public.development_members (development_id);

-- ============================================================================
-- 5. LEADS
-- ============================================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  development_id uuid not null references public.developments(id) on delete restrict,
  lot_id uuid references public.lots(id) on delete set null,

  -- Contact
  first_name text,
  last_name text,
  email text,
  phone text,
  message text,

  -- Pipeline
  stage text not null default 'new'
    check (stage in ('new','contacted','qualified','showing','offer','closed_won','closed_lost')),
  stage_changed_at timestamptz not null default now(),

  -- Qualification
  budget_min_cents bigint,
  budget_max_cents bigint,
  timeline text check (timeline in ('0_3mo','3_6mo','6_12mo','12mo_plus','unknown')),
  financing text check (financing in ('cash','pre_approved','needs_financing','unknown')),

  -- Source / attribution
  source text not null default 'website_form'
    check (source in ('website_form','referral','ad','walk_in','phone','other')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer_url text,
  landing_page text,

  -- Ownership
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,

  -- Meta
  status text not null default 'open'
    check (status in ('open','archived','duplicate')),
  raw_payload jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_development_stage_created_idx on public.leads (development_id, stage, created_at desc);
create index leads_assigned_agent_idx on public.leads (assigned_agent_id, stage);
create index leads_created_idx on public.leads (created_at desc);
create index leads_email_idx on public.leads (lower(email));
create index leads_phone_idx on public.leads (phone);

-- ============================================================================
-- 6. LEAD ACTIVITIES
-- ============================================================================

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null, -- null = system event
  type text not null
    check (type in ('note','call','email','sms','whatsapp','showing','stage_change','assignment','system')),
  body text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index lead_activities_lead_occurred_idx on public.lead_activities (lead_id, occurred_at desc);

-- ============================================================================
-- 7. NOTIFICATION LOG
-- ============================================================================

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('email','sms','slack','whatsapp')),
  recipient text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_log_lead_idx on public.notification_log (lead_id);
create index notification_log_retry_idx on public.notification_log (status, created_at)
  where status in ('queued','failed');

-- ============================================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger developments_set_updated_at before update on public.developments
  for each row execute function public.set_updated_at();
create trigger lots_set_updated_at before update on public.lots
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Track stage transitions automatically.
create or replace function public.track_lead_stage_change()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at = now();
    insert into public.lead_activities (lead_id, profile_id, type, body, metadata)
    values (
      new.id,
      auth.uid(),
      'stage_change',
      format('Stage: %s -> %s', old.stage, new.stage),
      jsonb_build_object('old_stage', old.stage, 'new_stage', new.stage)
    );
  end if;
  if new.assigned_agent_id is distinct from old.assigned_agent_id then
    new.assigned_at = now();
    insert into public.lead_activities (lead_id, profile_id, type, body, metadata)
    values (
      new.id,
      auth.uid(),
      'assignment',
      case
        when new.assigned_agent_id is null then 'Unassigned'
        else format('Assigned to %s', new.assigned_agent_id)
      end,
      jsonb_build_object('old_agent', old.assigned_agent_id, 'new_agent', new.assigned_agent_id)
    );
  end if;
  return new;
end;
$$;

create trigger leads_track_stage_change before update on public.leads
  for each row execute function public.track_lead_stage_change();

-- ============================================================================
-- 9. HELPER FUNCTIONS FOR RLS
-- ============================================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_development_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select development_id from public.development_members where profile_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- ============================================================================
-- 10. ROW-LEVEL SECURITY
-- ============================================================================

alter table public.developments enable row level security;
alter table public.lots enable row level security;
alter table public.profiles enable row level security;
alter table public.development_members enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.notification_log enable row level security;

-- --- developments ---------------------------------------------------------
create policy developments_read_authenticated on public.developments
  for select to authenticated using (true);

create policy developments_write_admin on public.developments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- lots -----------------------------------------------------------------
create policy lots_read_authenticated on public.lots
  for select to authenticated using (true);

create policy lots_write_admin on public.lots
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- profiles -------------------------------------------------------------
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_admin_read on public.profiles
  for select to authenticated using (public.is_admin());

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- development_members --------------------------------------------------
create policy development_members_self_read on public.development_members
  for select to authenticated using (profile_id = auth.uid());

create policy development_members_admin_all on public.development_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- leads ----------------------------------------------------------------
-- Admin: full access.
create policy leads_admin_all on public.leads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sales agent: leads assigned to them OR unassigned leads in their developments.
-- Marketing role reads the aggregate view, NOT the raw table (see view below).
create policy leads_agent_select on public.leads
  for select to authenticated
  using (
    public.current_user_role() = 'sales_agent'
    and (
      assigned_agent_id = auth.uid()
      or (assigned_agent_id is null and development_id in (select public.current_user_development_ids()))
    )
  );

-- Sales agent can update only leads they can SELECT (self-assigned or unassigned in their dev).
create policy leads_agent_update on public.leads
  for update to authenticated
  using (
    public.current_user_role() = 'sales_agent'
    and (
      assigned_agent_id = auth.uid()
      or (assigned_agent_id is null and development_id in (select public.current_user_development_ids()))
    )
  )
  with check (
    public.current_user_role() = 'sales_agent'
    and (assigned_agent_id = auth.uid() or assigned_agent_id is null)
  );

-- INSERT is service-role only. No anon, no authenticated insert policy.

-- --- lead_activities ------------------------------------------------------
create policy lead_activities_admin_all on public.lead_activities
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy lead_activities_select_if_lead_visible on public.lead_activities
  for select to authenticated
  using (
    exists (select 1 from public.leads l where l.id = lead_activities.lead_id)
  );

create policy lead_activities_insert_self on public.lead_activities
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.leads l where l.id = lead_activities.lead_id)
  );

-- --- notification_log -----------------------------------------------------
create policy notification_log_admin_read on public.notification_log
  for select to authenticated using (public.is_admin());
-- Writes are service-role only.

-- ============================================================================
-- 11. MARKETING AGGREGATE VIEW (PII-free)
-- ============================================================================

create or replace view public.leads_marketing_aggregate
with (security_invoker = true)
as
select
  id,
  development_id,
  lot_id,
  stage,
  stage_changed_at,
  source,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  referrer_url,
  landing_page,
  budget_min_cents,
  budget_max_cents,
  timeline,
  financing,
  created_at
from public.leads
where (
  public.current_user_role() in ('admin','marketing')
);

grant select on public.leads_marketing_aggregate to authenticated;
