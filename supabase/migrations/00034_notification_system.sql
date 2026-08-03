-- ============================================================
-- Migration: Notification system (Telegram + delivery ledger)
-- (2026-08-03)
--
-- - site_settings.notification_config: JSONB admin-managed
--   notification preferences (master switch, per-category and
--   per-event toggles, priority overrides, recipients list).
--   Non-secret by design — the bot token lives encrypted in
--   integration_settings (same as other API keys).
-- - notification_deliveries: append-only history of every send
--   attempt (one row per recipient), so the admin page can show
--   delivery status and retry failures.
-- - Service-role-only model (RLS enabled, no policies), exactly
--   like health_checks / backups / audit_log.
-- ============================================================

-- ---------- site_settings: notification config ----------
alter table public.site_settings
  add column if not exists notification_config jsonb
    not null default '{}'::jsonb;

-- ---------- notification_deliveries: send history ----------
create table if not exists public.notification_deliveries (
  id              uuid primary key default gen_random_uuid(),
  event           text not null,
  category        text not null,
  priority        text not null default 'normal',
  title           text not null,
  message         text not null default '',
  channel         text not null default 'telegram',
  chat_id         text not null,
  recipient_label text not null default '',
  status          text not null default 'sent',
  error           text,
  attempts        integer not null default 1,
  created_at      timestamptz not null default now(),
  delivered_at    timestamptz
);

create index if not exists notification_deliveries_created_at_idx
  on public.notification_deliveries (created_at desc);

create index if not exists notification_deliveries_status_idx
  on public.notification_deliveries (status, created_at desc);

alter table public.notification_deliveries enable row level security;
-- No policies: only the service role (which bypasses RLS) may
-- read/write this table. Admin reads go through the service-role
-- client. Deliberately NOT granted to anon (send history is private).

-- Explicit Data API grants (required for tables created after the
-- Supabase "explicit grants" change — see 00031). Authenticated
-- receives grants so the Data API surface is complete; RLS (no
-- policies) still denies all non-service-role rows.
grant select, insert, update, delete on public.notification_deliveries
  to authenticated, service_role;
