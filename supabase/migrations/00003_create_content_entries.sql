-- ============================================================
-- Migration: Create content_entries table
-- Portfolio CMS — reusable content management foundation
-- ============================================================

create table if not exists public.content_entries (
  id         uuid primary key default gen_random_uuid(),
  key        text not null,
  title      text not null default '',
  content    jsonb not null default '{}'::jsonb,
  status     text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_entries
  add constraint content_entries_key_unique unique (key);

alter table public.content_entries
  add constraint content_entries_status_check
    check (status in ('draft', 'published', 'archived'));

alter table public.content_entries
  add constraint content_entries_key_not_empty
    check (key <> '');

create index if not exists idx_content_entries_key
  on public.content_entries (key);

create index if not exists idx_content_entries_status
  on public.content_entries (status);

create index if not exists idx_content_entries_content
  on public.content_entries using gin (content);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_updated_at
  before update on public.content_entries
  for each row
  execute function public.handle_updated_at();

alter table public.content_entries enable row level security;

create policy "Anyone can view published content"
  on public.content_entries
  for select
  using (status = 'published');

create policy "Authenticated users can read all content"
  on public.content_entries
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert content"
  on public.content_entries
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update content"
  on public.content_entries
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete content"
  on public.content_entries
  for delete
  to authenticated
  using (true);
