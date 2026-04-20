-- Add opportunity-style fields to leads so they can be edited like deals
-- in a full CRM (Opportunity Name, Business Name, Tags, Notes).

alter table public.leads
  add column if not exists title text,
  add column if not exists business_name text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists notes text;

-- Backfill title from first+last name so existing leads have a readable
-- opportunity name.
update public.leads
set title = trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
where title is null;
