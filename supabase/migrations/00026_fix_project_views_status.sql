-- ============================================================
-- Migration: Fix increment_project_views status filter (2026-08-01)
-- Projects use status 'active' (not 'published'); the original
-- RPC only incremented rows with status = 'published', so views
-- never counted. Accept both values.
-- ============================================================

create or replace function public.increment_project_views(p_slug text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.projects set views = views + 1
  where slug = p_slug and status in ('active', 'published');
end;
$$;

revoke all on function public.increment_project_views(text) from public;
grant execute on function public.increment_project_views(text) to anon, authenticated;
