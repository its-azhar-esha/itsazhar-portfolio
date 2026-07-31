-- 00009_leads.sql
-- Lead CRM: public lead capture + admin management.

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 200),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone      text,
  message    text,
  source     text not null default 'contact' check (char_length(source) <= 50),
  status     text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Anyone (including anonymous visitors) can submit a lead.
create policy "Anyone can submit a lead"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can view, update or delete leads.
create policy "Authenticated users can view leads"
  on public.leads
  for select
  to authenticated
  using (true);

create policy "Authenticated users can update leads"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete leads"
  on public.leads
  for delete
  to authenticated
  using (true);

-- Auto-update updated_at (function created in 00008).
create or replace trigger set_updated_at_leads
  before update on public.leads
  for each row
  execute function public.handle_updated_at();
