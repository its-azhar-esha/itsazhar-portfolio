-- ============================================================
-- Migration: Create site_settings table
-- Portfolio CMS — editable site config + toggles (Phase 8D)
-- ============================================================

create table if not exists public.site_settings (
  id         uuid primary key default gen_random_uuid(),

  -- identity
  site_name text not null default 'Azhar',
  tagline   text not null default 'AI Automation Specialist',
  location  text not null default 'Remote, Worldwide',

  -- contact
  contact_email text not null default 'azharmahmudalif@gmail.com',
  contact_phone text,

  -- socials
  social_github   text,
  social_linkedin text,
  social_twitter  text,
  social_fiverr   text,

  -- content
  footer_text text not null default '© 2026 Azhar (itsazhar.com). All rights reserved.',

  -- toggles
  maintenance_mode          boolean not null default false,
  show_ai_chat              boolean not null default true,
  featured_projects_enabled boolean not null default true,
  featured_services_enabled boolean not null default true,

  -- analytics
  ga4_measurement_id text,
  gtm_id             text,
  clarity_project_id text,

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Single-row settings (fixed id so upsert is deterministic)
insert into public.site_settings (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Trigger: auto-update updated_at
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
  before update on public.site_settings
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.site_settings enable row level security;

create policy "Anyone can read site settings"
  on public.site_settings
  for select
  using (true);

create policy "Authenticated users can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (true);
