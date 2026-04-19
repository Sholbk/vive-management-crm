-- Stage labels let admins rename the 7 Kanban columns without touching the
-- underlying enum (or the intake API, reports, RLS, etc.). Lookup table
-- keyed by the existing stage enum values.

create table public.stage_labels (
  stage_key text primary key,
  display_name text not null,
  sort_order int not null,
  updated_at timestamptz not null default now()
);

insert into public.stage_labels (stage_key, display_name, sort_order) values
  ('new',         'New',          1),
  ('contacted',   'Contacted',    2),
  ('qualified',   'Qualified',    3),
  ('showing',     'Showing',      4),
  ('offer',       'Offer',        5),
  ('closed_won',  'Closed Won',   6),
  ('closed_lost', 'Closed Lost',  7);

alter table public.stage_labels enable row level security;

create policy stage_labels_read on public.stage_labels
  for select to authenticated using (true);

create policy stage_labels_admin_write on public.stage_labels
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger stage_labels_set_updated_at
  before update on public.stage_labels
  for each row execute function public.set_updated_at();
