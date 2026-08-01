-- ============================================================
-- Migration: Media folders/tags, audit log, login history,
-- integration settings (encrypted), content version history,
-- scheduled publishing (2026-08-01)
-- - media_files.folder: storage "folder" the file lives in
--   (path prefix inside the media bucket); default 'media'.
-- - media_files.tags: text[] tags for filtering/organizing.
-- - audit_log: append-only log of important admin actions
--   (service role only — no RLS policies granted).
-- - login_history: sign-in attempts (success/failure) with IP +
--   user agent (service role only).
-- - integration_settings: external API integrations managed from
--   the admin panel. Secret values are stored AES-256-GCM
--   encrypted; only ciphertext ever reaches the database.
-- - content_versions: snapshot history for content types
--   (entity, entity_id, version, full row data) enabling
--   previous-version browsing, comparison and restore.
-- - blog_posts/projects/services.scheduled_for: optional future
--   publish timestamp; public queries treat rows as published
--   only once now() >= scheduled_for (all public pages are
--   dynamic, so no cron is needed).
-- ============================================================

-- ---------- media_files: folders + tags ----------
alter table public.media_files
  add column if not exists folder text not null default 'media';

alter table public.media_files
  add column if not exists tags text[] not null default '{}';

-- ---------- audit_log: append-only admin activity ----------
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  entity     text not null default '',
  entity_id  text not null default '',
  detail     jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;
-- No policies: service role only (same model as health_checks/backups).

-- ---------- login_history: sign-in attempts ----------
create table if not exists public.login_history (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  success    boolean not null default false,
  ip         text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists login_history_created_at_idx on public.login_history (created_at desc);

alter table public.login_history enable row level security;
-- No policies: service role only.

-- ---------- integration_settings: admin-managed API integrations ----------
create table if not exists public.integration_settings (
  id          text primary key,
  label       text not null,
  status      text not null default 'unconfigured'
              check (status in ('unconfigured', 'configured', 'error')),
  config      jsonb not null default '{}'::jsonb,
  expires_at  timestamptz,
  rotated_at  timestamptz,
  usage_count bigint not null default 0,
  last_used_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.integration_settings enable row level security;
-- No policies: service role only (contains encrypted secrets).

-- ---------- content_versions: snapshot history ----------
create table if not exists public.content_versions (
  id         uuid primary key default gen_random_uuid(),
  entity     text not null,
  entity_id  text not null,
  version    integer not null,
  data       jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  constraint content_versions_unique unique (entity, entity_id, version)
);

create index if not exists content_versions_lookup_idx
  on public.content_versions (entity, entity_id, version desc);

alter table public.content_versions enable row level security;
-- No policies: service role only.

-- ---------- scheduled publishing ----------
alter table public.blog_posts
  add column if not exists scheduled_for timestamptz;

alter table public.projects
  add column if not exists scheduled_for timestamptz;

alter table public.services
  add column if not exists scheduled_for timestamptz;
