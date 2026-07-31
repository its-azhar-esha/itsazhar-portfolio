-- ============================================================
-- Migration: Section visibility toggles (Phase 8E)
-- One switch per homepage section, managed in Admin > Settings.
-- ============================================================

alter table public.site_settings add column if not exists show_hero          boolean not null default true;
alter table public.site_settings add column if not exists show_showcase      boolean not null default true;
alter table public.site_settings add column if not exists show_services      boolean not null default true;
alter table public.site_settings add column if not exists show_case_studies  boolean not null default true;
alter table public.site_settings add column if not exists show_about         boolean not null default true;
alter table public.site_settings add column if not exists show_testimonials  boolean not null default false;
alter table public.site_settings add column if not exists show_contact       boolean not null default true;

-- Backfill the single settings row from the legacy featured_* flags so
-- current behavior is preserved after the toggle rename.
update public.site_settings
set
  show_services     = featured_services_enabled,
  show_case_studies = featured_projects_enabled
where id = '00000000-0000-0000-0000-000000000001';
