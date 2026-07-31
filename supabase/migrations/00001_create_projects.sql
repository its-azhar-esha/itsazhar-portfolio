-- ============================================================
-- Migration: Create projects table
-- Portfolio CMS — production-ready schema
-- ============================================================

-- 1. Create the table
create table if not exists public.projects (
  -- identifiers
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null,

  -- content
  short_description text not null default '',
  description       text,
  industry          text[] default '{}',
  category          text not null default '',
  technologies      text[] default '{}',

  -- media
  thumbnail   text,
  images      text[] default '{}',
  video_url   text,

  -- links
  client      text,
  demo_url    text,
  github_url  text,

  -- publishing
  featured      boolean not null default false,
  status        text not null default 'draft',
  "order"       integer not null default 0,

  -- seo
  seo_title       text,
  seo_description text,
  keywords        text[] default '{}',
  og_image        text,
  canonical_url   text,

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Constraints
alter table public.projects
  add constraint projects_slug_unique unique (slug);

alter table public.projects
  add constraint projects_status_check
    check (status in ('draft', 'active', 'archived'));

alter table public.projects
  add constraint projects_slug_not_empty
    check (slug <> '');

-- 3. Indexes
create index if not exists idx_projects_slug
  on public.projects (slug);

create index if not exists idx_projects_featured
  on public.projects (featured);

create index if not exists idx_projects_status
  on public.projects (status);

create index if not exists idx_projects_industry
  on public.projects using gin (industry);

create index if not exists idx_projects_order
  on public.projects ("order");

create index if not exists idx_projects_created_at
  on public.projects (created_at desc);

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
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

-- 5. Row Level Security
alter table public.projects enable row level security;

-- 5a. Anonymous: SELECT only active projects
create policy "Anyone can view active projects"
  on public.projects
  for select
  using (status = 'active');

-- 5b. Authenticated: full CRUD
create policy "Authenticated users can read all projects"
  on public.projects
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert projects"
  on public.projects
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on public.projects
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete projects"
  on public.projects
  for delete
  to authenticated
  using (true);
