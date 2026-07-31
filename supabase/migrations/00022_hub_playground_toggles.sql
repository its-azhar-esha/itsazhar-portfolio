-- ============================================================
-- Migration 00022: settings toggles for Hub + Playground
-- ============================================================

alter table public.site_settings
  add column if not exists show_hub boolean not null default true;

alter table public.site_settings
  add column if not exists show_playground boolean not null default true;
