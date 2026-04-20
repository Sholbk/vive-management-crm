-- Give contacts a primary assigned salesperson. Kept separate from
-- leads.assigned_agent_id because a contact can exist without any pipeline
-- entry (Clients, Vendors) and because the "owner" of a person is a
-- different concept from the "owner" of a specific deal.

alter table public.contacts
  add column assigned_agent_id uuid references public.profiles(id) on delete set null;

create index contacts_assigned_agent_id_idx on public.contacts(assigned_agent_id);
