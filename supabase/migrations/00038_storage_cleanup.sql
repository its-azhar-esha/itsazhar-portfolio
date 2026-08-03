-- 00038_storage_cleanup.sql
-- Storage & Cleanup admin section: persists per-category scan results so the
-- admin UI can show "last scan time", "status" and item counts across reloads.
--
-- The scans themselves (and all cleanup mutations) run server-side with the
-- service-role client; this table is only a small report ledger that admin
-- server actions read/write. RLS still gates it per the project rule, and
-- explicit grants are required for the Data API (Oct 30, 2026 change).

create table if not exists public.cleanup_scans (
  category text primary key,
  scanned_at timestamptz not null default now(),
  status text not null default 'clean',          -- clean | issues | error
  total integer not null default 0,
  size_bytes bigint not null default 0,
  summary jsonb not null default '{}'::jsonb,     -- category-specific detail
  items jsonb not null default '[]'::jsonb        -- capped sample of candidates
);

alter table public.cleanup_scans enable row level security;
-- No policies: service role only (same model as audit_log/health_checks/backups).

-- Explicit Data API grants (required for tables created after Oct 30, 2026).
grant select, insert, update, delete on table public.cleanup_scans to anon, authenticated, service_role;
