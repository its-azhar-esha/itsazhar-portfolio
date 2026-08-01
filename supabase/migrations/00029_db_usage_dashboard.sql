-- 00029: Database usage snapshot for the admin dashboard.
--
-- Returns the physical database size, an approximate total row count and
-- per-table size/row estimates for all public tables (largest first).
-- Estimates use pg_stat_user_tables (n_live_tup) — cheap and close enough
-- for capacity widgets.

create or replace function public.get_db_usage()
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'total_rows', coalesce((
      select sum(s.n_live_tup)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_stat_user_tables s on s.relid = c.oid
      where n.nspname = 'public' and c.relkind = 'r'
        and not c.relname like 'pg_%'
    ), 0),
    'tables', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', c.relname,
          'rows', coalesce(s.n_live_tup, 0),
          'size_bytes', pg_total_relation_size(c.oid)
        ) order by pg_total_relation_size(c.oid) desc
      )
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_stat_user_tables s on s.relid = c.oid
      where n.nspname = 'public' and c.relkind = 'r'
        and not c.relname like 'pg_%'
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_db_usage() from public;
grant execute on function public.get_db_usage() to authenticated, service_role;
