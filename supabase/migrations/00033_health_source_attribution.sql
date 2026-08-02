-- 00033: Attribute health-check ledger rows to the scheduler that wrote them.
--
-- Both Vercel cron (/api/health, x-vercel-cron) and the GitHub Actions
-- keepalive workflow (x-health-key header) are authoritative writers of the
-- daily health_checks ledger. Previously they upserted on checked_on alone,
-- so the day's single row was overwritten by whichever ran last and the
-- keep-alive report attributed both scheduled jobs to the same inferred
-- data. Add a `source` column and make the day's row unique per source so
-- each scheduler is reported from its own real ledger data.

alter table public.health_checks
  add column if not exists source text
    not null default 'vercel'
    check (source in ('vercel', 'github', 'public'));

-- One row per (day, source) instead of one row per day.
alter table public.health_checks
  drop constraint if exists health_checks_checked_on_unique;

alter table public.health_checks
  add constraint health_checks_checked_on_source_unique unique (checked_on, source);

-- Backfill: rows written before this migration were shared between
-- schedulers; attribute them to the primary (Vercel cron) writer.
update public.health_checks
  set source = 'vercel'
  where source is null;

-- Also allow the backup ledger to be attributed per scheduler in the future
-- (only Vercel cron writes today; kept symmetric for parity).
alter table public.backups
  add column if not exists source text
    not null default 'vercel'
    check (source in ('vercel', 'github'));

alter table public.backups
  drop constraint if exists backups_backup_date_unique;

alter table public.backups
  add constraint backups_backup_date_source_unique unique (backup_date, source);
