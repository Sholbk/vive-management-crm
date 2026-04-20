-- Let any authenticated user insert/update contacts. The admin-only policy
-- was too strict: sales agents need to maintain their contact records too.
-- Delete is still admin-only via the existing contacts_admin_all policy.

create policy contacts_insert_authenticated on public.contacts
  for insert to authenticated
  with check (true);

create policy contacts_update_authenticated on public.contacts
  for update to authenticated
  using (true)
  with check (true);
