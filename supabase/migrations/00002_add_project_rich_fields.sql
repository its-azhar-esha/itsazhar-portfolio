-- ============================================================
-- Migration: Add rich content fields to projects table
-- Portfolio CMS — supports public detail pages
-- ============================================================

alter table public.projects
  add column if not exists challenge text,
  add column if not exists solution text,
  add column if not exists workflow text[] default '{}',
  add column if not exists impact text;
