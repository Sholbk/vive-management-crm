-- A lead has one primary development (leads.development_id, already present)
-- that determines which Kanban pipeline they show up in, plus zero or more
-- "also interested in" developments a real estate buyer might be weighing.
-- No FK on array elements (Postgres doesn't support it); the UI is responsible
-- for passing valid IDs.

alter table public.leads
  add column if not exists additional_development_ids uuid[] not null default '{}';
