-- ============================================================
-- Migration: Create blog posts table (2026-07-31)
-- Authority blogging module: draft/publish workflow, categories
-- and tags (text[]), cover image (media reference), SEO fields.
-- ============================================================

create table if not exists public.blog_posts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 200),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt        text not null default '' check (char_length(excerpt) <= 500),
  content        text not null default '' check (char_length(content) <= 200000),
  cover_image    text,
  categories     text[] not null default '{}',
  tags           text[] not null default '{}',
  author         text not null default 'Azhar' check (char_length(author) <= 100),
  status         text not null default 'draft' check (status in ('draft', 'published')),
  featured       boolean not null default false,
  published_at   timestamptz,
  seo_title      text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 160),
  og_image       text,
  canonical_url  text,
  keywords       text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_blog_posts_slug
  on public.blog_posts (slug);

create index if not exists idx_blog_posts_status
  on public.blog_posts (status);

create index if not exists idx_blog_posts_published_at
  on public.blog_posts (published_at desc);

create index if not exists idx_blog_posts_categories
  on public.blog_posts using gin (categories);

create or replace trigger set_updated_at_blog_posts
  before update on public.blog_posts
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.blog_posts enable row level security;

create policy "Anyone can view published blog posts"
  on public.blog_posts
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Authenticated users can view all blog posts"
  on public.blog_posts
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create blog posts"
  on public.blog_posts
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update blog posts"
  on public.blog_posts
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete blog posts"
  on public.blog_posts
  for delete
  to authenticated
  using (true);
