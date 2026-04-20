-- Schema additions for the second round of activity features.

-- Tasks: can be assigned to a team member.
alter table public.lead_tasks
  add column if not exists assigned_to_profile_id uuid
    references public.profiles(id) on delete set null;

-- Payments: capture how and under what reference.
alter table public.lead_payments
  add column if not exists payment_method text
    check (payment_method in ('cash','check','card','wire','other') or payment_method is null),
  add column if not exists reference text;

-- Additional Contacts: relationship to the primary contact.
alter table public.lead_additional_contacts
  add column if not exists relationship text
    check (
      relationship in ('spouse','partner','parent','child','sibling','other')
      or relationship is null
    );
