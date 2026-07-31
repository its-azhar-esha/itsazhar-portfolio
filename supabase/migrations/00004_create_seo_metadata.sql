-- ============================================================
-- Migration: Create seo_metadata table
-- Portfolio CMS — page-level SEO metadata management
-- ============================================================

create table if not exists public.seo_metadata (
  id            uuid primary key default gen_random_uuid(),
  page_key      text not null,
  title         text not null,
  description   text,
  keywords      text[] not null default '{}'::text[],
  og_image      text,
  canonical_url text,
  robots        text not null default 'index,follow',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.seo_metadata
  add constraint seo_metadata_page_key_unique unique (page_key);

alter table public.seo_metadata
  add constraint seo_metadata_page_key_not_empty
    check (page_key <> '');

alter table public.seo_metadata
  add constraint seo_metadata_robots_valid
    check (robots in ('index,follow', 'index,nofollow', 'noindex,follow', 'noindex,nofollow'));

create index if not exists idx_seo_metadata_page_key
  on public.seo_metadata (page_key);

create index if not exists idx_seo_metadata_updated_at
  on public.seo_metadata (updated_at desc);

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
  before update on public.seo_metadata
  for each row
  execute function public.handle_updated_at();

alter table public.seo_metadata enable row level security;

create policy "Anyone can read SEO metadata"
  on public.seo_metadata
  for select
  using (true);

create policy "Authenticated users can insert SEO metadata"
  on public.seo_metadata
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update SEO metadata"
  on public.seo_metadata
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete SEO metadata"
  on public.seo_metadata
  for delete
  to authenticated
  using (true);

-- Seed default SEO entries
insert into public.seo_metadata (page_key, title, description, keywords, robots) values
  (
    'home',
    'Azhar Mahmud | AI Automation Engineer',
    'AI automation solutions, workflow engineering, and intelligent business systems.',
    '{ai automation, workflow engineering, business automation, ai engineer, intelligent systems}',
    'index,follow'
  ),
  (
    'about',
    'About Me — Azhar Mahmud | AI Automation Specialist',
    'I build intelligent automation systems that help businesses eliminate repetitive work, streamline operations, and scale efficiently using AI, workflows, and modern integrations.',
    '{about, ai automation specialist, workflow automation, business automation}',
    'index,follow'
  ),
  (
    'projects',
    'Featured Systems & Automation Projects | Azhar Mahmud',
    'Explore production-ready AI systems, workflow automations, and business solutions designed to eliminate repetitive work and improve operational efficiency.',
    '{projects, ai systems, automation projects, workflow automations}',
    'index,follow'
  ),
  (
    'contact',
    'Contact | Book a Free Automation Audit',
    'Book a free 15-minute automation audit. Find automation opportunities in your business workflow — no pressure, no obligation.',
    '{contact, automation audit, free consultation, business workflow}',
    'index,follow'
  )
on conflict (page_key) do nothing;
