-- Contacts: unique people in the CRM, deduped on email.
-- A lead (pipeline entry) links to a contact via contact_id. Contacts can
-- exist without a lead (e.g. Clients, Vendors) and accumulate multiple leads
-- over their lifecycle.

create type public.contact_type as enum ('lead', 'client', 'vendor', 'other');

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text unique,
  phone text,
  date_of_birth date,
  contact_source text,
  contact_type public.contact_type not null default 'lead',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_type_idx on public.contacts(contact_type);
create index contacts_email_lower_idx on public.contacts(lower(email));

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Link leads to contacts. Added as nullable so the backfill below can run,
-- then enforced by future code (the intake endpoint always sets it).
alter table public.leads add column contact_id uuid references public.contacts(id) on delete set null;

-- Backfill: one contact per distinct lead email (newest wins on name/phone).
insert into public.contacts (first_name, last_name, email, phone, contact_type)
select distinct on (lower(email))
  first_name, last_name, email, phone, 'lead'::public.contact_type
from public.leads
where email is not null
order by lower(email), created_at desc;

update public.leads l
set contact_id = c.id
from public.contacts c
where l.contact_id is null
  and l.email is not null
  and lower(l.email) = lower(c.email);

create index leads_contact_id_idx on public.leads(contact_id);

alter table public.contacts enable row level security;

-- Admins: full CRUD.
create policy contacts_admin_all on public.contacts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Everyone authenticated can read contacts (for the Contacts list).
create policy contacts_read_authenticated on public.contacts
  for select to authenticated
  using (true);
