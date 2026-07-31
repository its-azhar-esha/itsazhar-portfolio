-- ============================================================
-- Migration: Create services table
-- Portfolio CMS — services management schema
-- ============================================================

create table if not exists public.services (
  -- identifiers
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  title       text not null,

  -- content
  short_description text not null default '',
  content           jsonb not null default '{}'::jsonb,
  icon              text not null default 'bot',

  -- publishing
  featured      boolean not null default false,
  display_order integer not null default 0,
  status        text not null default 'draft',

  -- seo
  seo_title       text,
  seo_description text,
  seo_keywords    text[] not null default '{}'::text[],

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Constraints
alter table public.services
  add constraint services_slug_unique unique (slug);

alter table public.services
  add constraint services_status_check
    check (status in ('draft', 'published'));

alter table public.services
  add constraint services_slug_not_empty
    check (slug <> '');

alter table public.services
  add constraint services_title_not_empty
    check (title <> '');

alter table public.services
  add constraint services_display_order_nonnegative
    check (display_order >= 0);

-- 3. Indexes
create index if not exists idx_services_slug
  on public.services (slug);

create index if not exists idx_services_status
  on public.services (status);

create index if not exists idx_services_featured
  on public.services (featured);

create index if not exists idx_services_display_order
  on public.services (display_order);

create index if not exists idx_services_created_at
  on public.services (created_at desc);

-- 4. Trigger: auto-update updated_at
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
  before update on public.services
  for each row
  execute function public.handle_updated_at();

-- 5. Row Level Security
alter table public.services enable row level security;

create policy "Anyone can view published services"
  on public.services
  for select
  using (status = 'published');

create policy "Authenticated users can read all services"
  on public.services
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert services"
  on public.services
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update services"
  on public.services
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete services"
  on public.services
  for delete
  to authenticated
  using (true);
