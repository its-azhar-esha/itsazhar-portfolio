-- ============================================================
-- Migration: Add key features and future scope fields to projects
-- Portfolio CMS — supports public project detail pages
-- ============================================================

alter table public.projects
  add column if not exists key_features text[] default '{}',
  add column if not exists future_scope text;

-- Row-level security: projects table edits are gated by the existing
-- authenticated-write policy. Adding columns does not create a new table,
-- so the existing Data API grants (00031) continue to cover the new columns.