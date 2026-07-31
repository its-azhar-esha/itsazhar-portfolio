-- ============================================================
-- Migration: Expand site settings (2026-07-31)
-- Adds branding, booking, social and blog fields requested for
-- richer site configuration (site title, logo, booking URL,
-- extra socials, blog section toggle).
-- ============================================================

alter table public.site_settings
  add column if not exists site_title       text not null default '',
  add column if not exists site_description text not null default '',
  add column if not exists logo             text,
  add column if not exists booking_url      text,
  add column if not exists social_instagram text,
  add column if not exists social_youtube   text,
  add column if not exists show_blog        boolean not null default true;

-- Backfill the new branding fields for the existing row.
update public.site_settings
  set site_title = site_name
  where site_title = '';

update public.site_settings
  set site_description = tagline
  where site_description = '';
