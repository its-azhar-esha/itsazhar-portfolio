-- 00032_monitoring_config.sql
-- Adds admin-configurable monitoring/domain settings to site_settings so
-- switching the public domain later needs no code changes:
--   site_url       - canonical site URL ("" = derive from NEXT_PUBLIC_SITE_URL
--                    env or the project default). Used for SEO canonicals,
--                    sitemap, robots, and as the base for health/backup URLs.
--   health_check_url - override for the keep-alive endpoint ("" = derive).
--   backup_url        - override for the backup endpoint ("" = derive).
--   webhooks          - array of { id, url, enabled, name } endpoints fired
--                    on health/backup failure.
--
-- Column inheritance: this ALTERs an existing table (site_settings), which
-- already has explicit grants from migration 00031 — columns inherit table
-- grants automatically, so no new GRANT statements are required here.

alter table public.site_settings
  add column if not exists monitoring_config jsonb not null default '{}'::jsonb;
