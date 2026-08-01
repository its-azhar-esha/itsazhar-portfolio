-- ============================================================
-- Migration: Navigation order, admin-configurable analytics/DX
-- settings, health checks + backup ledger, RLS status RPC
-- (2026-08-01)
-- - site_settings.nav_order: JSONB list of { label, href, enabled }
--   rendered in order by the public navbar (drag-and-drop in
--   Settings > Navigation). Default: Home, Services, Projects,
--   About, Contact, Blog, Hub, Playground.
-- - site_settings.analytics_config: JSONB admin-configurable
--   analytics behavior (tracking on/off, retention + report
--   windows, search-keyword capture).
-- - site_settings.dx_config: JSONB admin-configurable developer
--   tools behavior (health-check recording, link-checker budget,
--   SEO target lengths).
-- - health_checks: one row per calendar day upserted by
--   /api/health (service role only — no RLS policies granted).
-- - backups: one row per nightly backup run, written by
--   /api/backup and the GitHub Actions backup workflow, so the
--   DX page can surface "last backup" status.
-- - list_rls_status(): admin-only RPC reporting RLS-enabled +
--   policy count per public table for the DX page.
-- ============================================================

-- ---------- site_settings: new config columns ----------
alter table public.site_settings
  add column if not exists nav_order jsonb
    not null default '[
      {"label": "Home", "href": "/", "enabled": true},
      {"label": "Services", "href": "/#services", "enabled": true},
      {"label": "Projects", "href": "/projects", "enabled": true},
      {"label": "About", "href": "/about", "enabled": true},
      {"label": "Contact", "href": "/#contact", "enabled": true},
      {"label": "Blog", "href": "/blog", "enabled": true},
      {"label": "Hub", "href": "/hub", "enabled": true},
      {"label": "Playground", "href": "/playground", "enabled": true}
    ]'::jsonb;

alter table public.site_settings
  add column if not exists analytics_config jsonb
    not null default '{
      "enabled": true,
      "retentionDays": 90,
      "windowDays": 30,
      "trackSearchKeywords": true
    }'::jsonb;

alter table public.site_settings
  add column if not exists dx_config jsonb
    not null default '{
      "recordHealthChecks": true,
      "linkCheckTimeoutMs": 8000,
      "linkCheckMaxUrls": 25,
      "seoTitleMax": 70,
      "seoDescMin": 120,
      "seoDescMax": 160
    }'::jsonb;

-- ---------- health_checks: daily keep-alive ledger ----------
create table if not exists public.health_checks (
  id         uuid primary key default gen_random_uuid(),
  checked_on date not null,
  ok         boolean not null default true,
  latency_ms integer,
  detail     text not null default '',
  created_at timestamptz not null default now(),
  constraint health_checks_checked_on_unique unique (checked_on)
);

alter table public.health_checks enable row level security;
-- No policies: only the service role (which bypasses RLS) may
-- read/write this table. Admin reads go through the DX report
-- which uses the service-role client.

-- ---------- backups: nightly backup ledger ----------
create table if not exists public.backups (
  id          uuid primary key default gen_random_uuid(),
  backup_date date not null,
  status      text not null default 'ok',
  table_count integer not null default 0,
  file_count  integer not null default 0,
  size_bytes  bigint not null default 0,
  manifest    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  constraint backups_backup_date_unique unique (backup_date)
);

alter table public.backups enable row level security;
-- Same model as health_checks: service role only.

-- ---------- DX: RLS status per public table ----------
create or replace function public.list_rls_status()
returns table (table_name text, rls_enabled boolean, policy_count bigint)
language sql security definer stable set search_path = public, pg_temp as $$
  select
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    coalesce(p.count, 0) as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join (
    select pol.polrelid, count(*) as count
    from pg_policy pol
    group by pol.polrelid
  ) p on p.polrelid = c.oid
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relname like 'pg_%'
  order by c.relname;
$$;

revoke all on function public.list_rls_status() from public;
grant execute on function public.list_rls_status() to authenticated, service_role;
