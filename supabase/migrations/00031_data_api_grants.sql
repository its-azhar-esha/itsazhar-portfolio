-- 00031_data_api_grants.sql
-- Future-proofs the Data API for the Supabase "explicit grants" breaking change
-- (https://supabase.com/changelog/45329), which is enforced on ALL existing
-- projects on October 30, 2026.
--
-- What changes: from that date, Supabase stops auto-granting
-- select/insert/update/delete on NEW public tables to anon/authenticated/
-- service_role. Existing tables keep their current grants, but any table
-- created afterwards WITHOUT an explicit GRANT becomes invisible to
-- supabase-js / PostgREST / GraphQL (permission denied).
--
-- This migration:
--   1) Makes the grants explicit and idempotent on every current public
--      table, so the project's connectivity baseline is reviewable and
--      matches the pre-change defaults.
--   2) Adds list_data_api_grants() so /admin/dx can flag any table that is
--      missing grants (an early-warning if a future migration forgets).
--
-- RULE GOING FORWARD: every migration that creates a table MUST include the
-- matching GRANT statements, or the table will be unreachable via the Data
-- API after Oct 30, 2026. RLS remains the actual access-control layer;
-- grants are the connectivity baseline.

-- 1) Explicit grants on every current public table (idempotent).
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- 2) Verification function used by /admin/dx "Data API grants" section.
create or replace function public.list_data_api_grants()
returns table (
  table_name text,
  anon_ok boolean,
  authenticated_ok boolean,
  service_role_ok boolean
)
language sql
security definer
set search_path = public
as $$
  select
    t.table_name,
    (
      select count(*) = 4
      from information_schema.role_table_grants g
      where g.table_schema = 'public'
        and g.table_name = t.table_name
        and g.grantee = 'anon'
        and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) as anon_ok,
    (
      select count(*) = 4
      from information_schema.role_table_grants g
      where g.table_schema = 'public'
        and g.table_name = t.table_name
        and g.grantee = 'authenticated'
        and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) as authenticated_ok,
    (
      select count(*) = 4
      from information_schema.role_table_grants g
      where g.table_schema = 'public'
        and g.table_name = t.table_name
        and g.grantee = 'service_role'
        and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) as service_role_ok
  from information_schema.tables t
  where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
  order by t.table_name;
$$;

revoke all on function public.list_data_api_grants() from public;
grant execute on function public.list_data_api_grants() to authenticated, service_role;
