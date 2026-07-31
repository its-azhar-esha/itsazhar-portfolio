-- 00011_reconcile_projects_status_check.sql
-- The remote projects table was created in the dashboard before local
-- migrations existed, with status constraint ('draft', 'published', 'archived').
-- The app (and migration 00001) uses 'active' for published projects, so the
-- remote constraint must accept it. 'published' is kept for backward
-- compatibility with any rows written via the dashboard.

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
    check (status in ('draft', 'active', 'published', 'archived'));
