-- Storage buckets + attachment tables for the CRM.
--
-- Buckets:
--   lead-documents     private  — files attached to a lead/contact (IDs, proof
--                                 of funds, signed docs). Served via signed URLs.
--   development-media   private  — brochures, floor plans, lot photos for a
--                                 development/lot. Internal; signed URLs.
--   email-assets        public   — logos/images embedded in outgoing emails;
--                                 must be publicly fetchable by mail clients.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('lead-documents',    'lead-documents',    false, 26214400),   -- 25 MB
  ('development-media', 'development-media',  false, 52428800),   -- 50 MB
  ('email-assets',      'email-assets',       true,   5242880)    -- 5 MB
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- storage.objects policies (RLS is already enabled on storage.objects).
-- Auth model mirrors the rest of the app: any authenticated user has full
-- access. email-assets is additionally world-readable.
-- ---------------------------------------------------------------------------

drop policy if exists "crm private buckets read"   on storage.objects;
drop policy if exists "crm private buckets insert" on storage.objects;
drop policy if exists "crm private buckets update" on storage.objects;
drop policy if exists "crm private buckets delete" on storage.objects;
drop policy if exists "email assets public read"   on storage.objects;
drop policy if exists "email assets write"          on storage.objects;

create policy "crm private buckets read" on storage.objects
  for select to authenticated
  using (bucket_id in ('lead-documents', 'development-media'));

create policy "crm private buckets insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('lead-documents', 'development-media'));

create policy "crm private buckets update" on storage.objects
  for update to authenticated
  using (bucket_id in ('lead-documents', 'development-media'))
  with check (bucket_id in ('lead-documents', 'development-media'));

create policy "crm private buckets delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('lead-documents', 'development-media'));

create policy "email assets public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'email-assets');

create policy "email assets write" on storage.objects
  for all to authenticated
  using (bucket_id = 'email-assets')
  with check (bucket_id = 'email-assets');

-- ---------------------------------------------------------------------------
-- Metadata tables. The file bytes live in storage; these rows track what is
-- attached to what, plus display metadata.
-- ---------------------------------------------------------------------------

create table if not exists public.lead_attachments (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  bucket      text not null default 'lead-documents',
  path        text not null unique,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists lead_attachments_lead_id_idx
  on public.lead_attachments (lead_id, created_at desc);

create table if not exists public.development_media (
  id             uuid primary key default gen_random_uuid(),
  development_id uuid not null references public.developments(id) on delete cascade,
  lot_id         uuid references public.lots(id) on delete set null,
  kind           text not null default 'other'
                   check (kind in ('brochure', 'floorplan', 'photo', 'other')),
  bucket         text not null default 'development-media',
  path           text not null unique,
  file_name      text not null,
  mime_type      text,
  size_bytes     bigint,
  uploaded_by    uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

create index if not exists development_media_development_id_idx
  on public.development_media (development_id, created_at desc);

alter table public.lead_attachments  enable row level security;
alter table public.development_media enable row level security;

drop policy if exists lead_attachments_authenticated  on public.lead_attachments;
drop policy if exists development_media_authenticated on public.development_media;

create policy lead_attachments_authenticated on public.lead_attachments
  for all to authenticated using (true) with check (true);

create policy development_media_authenticated on public.development_media
  for all to authenticated using (true) with check (true);
