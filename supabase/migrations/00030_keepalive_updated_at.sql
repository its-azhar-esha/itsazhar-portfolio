-- 00030: Track last actual run time on keep-alive ledger tables.
--
-- The health_checks and backups tables were upserted on checked_on /
-- backup_date, so `created_at` reflects only the FIRST insert of a day's
-- row and cannot distinguish "ran at 12:00" from "inserted at 06:12".
-- Add `updated_at` set on every upsert so freshness / last-run checks are
-- accurate.

alter table public.health_checks
  add column if not exists updated_at timestamptz;

alter table public.backups
  add column if not exists updated_at timestamptz;

-- Backfill existing rows with created_at so history stays sensible.
update public.health_checks
  set updated_at = created_at
  where updated_at is null;

update public.backups
  set updated_at = created_at
  where updated_at is null;

alter table public.health_checks
  alter column updated_at set not null;

alter table public.backups
  alter column updated_at set not null;
