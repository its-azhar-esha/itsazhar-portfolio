-- ============================================================
-- Migration: Create testimonials table (Phase 8E)
-- Admin-managed testimonials with animated public display
-- ============================================================

create table if not exists public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 200),
  role           text not null default '' check (char_length(role) <= 200),
  company        text check (char_length(company) <= 200),
  quote          text not null check (char_length(quote) between 1 and 2000),
  rating         integer not null default 5 check (rating between 1 and 5),
  avatar         text,
  display_order  integer not null default 0,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_testimonials
  before update on public.testimonials
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.testimonials enable row level security;

create policy "Anyone can view published testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Authenticated users can view all testimonials"
  on public.testimonials
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create testimonials"
  on public.testimonials
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update testimonials"
  on public.testimonials
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete testimonials"
  on public.testimonials
  for delete
  to authenticated
  using (true);
