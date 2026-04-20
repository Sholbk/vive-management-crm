-- The six "Coming soon" sections from the lead detail page, each in its
-- own table. Keeping RLS loose (authenticated read/write) for MVP \u2014 the
-- existing leads_admin_all / leads_agent_* policies already gate who can
-- see a lead in the first place, so a user who got to a lead detail page
-- already has permission to interact with its activities.

-- Tasks: simple todo/follow-up items per lead.
create table public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index lead_tasks_lead_id_idx on public.lead_tasks(lead_id);

-- Notes: free-form notes (timeline / activity feed).
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index lead_notes_lead_id_idx on public.lead_notes(lead_id);

-- Appointments: scheduled interactions.
create table public.lead_appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index lead_appointments_lead_id_idx on public.lead_appointments(lead_id);

-- Payments: money tracked against a deal.
create table public.lead_payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount_cents bigint not null,
  description text,
  status text not null default 'received'
    check (status in ('received', 'pending', 'refunded')),
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index lead_payments_lead_id_idx on public.lead_payments(lead_id);

-- Followers: users who want updates on this lead (many-to-many with profiles).
create table public.lead_followers (
  lead_id uuid not null references public.leads(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, profile_id)
);

-- Additional Contacts: family members, spouses, etc. (many-to-many with contacts).
create table public.lead_additional_contacts (
  lead_id uuid not null references public.leads(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, contact_id)
);

-- RLS (authenticated read/write on all six).
alter table public.lead_tasks enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_appointments enable row level security;
alter table public.lead_payments enable row level security;
alter table public.lead_followers enable row level security;
alter table public.lead_additional_contacts enable row level security;

create policy lead_tasks_authenticated on public.lead_tasks
  for all to authenticated using (true) with check (true);
create policy lead_notes_authenticated on public.lead_notes
  for all to authenticated using (true) with check (true);
create policy lead_appointments_authenticated on public.lead_appointments
  for all to authenticated using (true) with check (true);
create policy lead_payments_authenticated on public.lead_payments
  for all to authenticated using (true) with check (true);
create policy lead_followers_authenticated on public.lead_followers
  for all to authenticated using (true) with check (true);
create policy lead_additional_contacts_authenticated on public.lead_additional_contacts
  for all to authenticated using (true) with check (true);
