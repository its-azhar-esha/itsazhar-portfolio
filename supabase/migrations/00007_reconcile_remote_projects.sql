-- ============================================================
-- Migration: Reconcile remote projects table (2026-07-31)
-- The hosted projects table predates 00001's final schema:
--   has  thumbnail_url + gallery_urls (legacy)
--   lacks thumbnail, images, client, demo_url, keywords, "order"
-- `create table if not exists` in 00001 cannot add missing columns,
-- so this migration reconciles the hosted schema in place.
-- ============================================================

alter table public.projects
  add column if not exists thumbnail   text,
  add column if not exists images      text[] default '{}',
  add column if not exists client      text,
  add column if not exists demo_url    text,
  add column if not exists keywords    text[] default '{}',
  add column if not exists "order"     integer not null default 0;

create index if not exists idx_projects_order
  on public.projects ("order");
