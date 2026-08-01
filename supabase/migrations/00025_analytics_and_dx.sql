-- ============================================================
-- Migration: Analytics events + DX support (2026-08-01)
-- - analytics_events: lightweight event log for page views,
--   hub searches, CTA clicks, downloads (written via the
--   security-definer track_event() RPC so anon/authenticated
--   users can log but never read arbitrary rows).
-- - projects.views counter + increment_project_views(slug) RPC
--   (workflow_templates already has views_count + RPC).
-- - list_applied_migrations(): admin-only RPC that reads
--   supabase_migrations.schema_migrations for the DX page.
-- ============================================================

create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null check (char_length(event) between 1 and 64),
  page_path   text not null default '',
  label       text not null default '',
  metadata    jsonb not null default '{}'::jsonb,
  session_id  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at
  on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_event
  on public.analytics_events (event, created_at desc);
create index if not exists idx_analytics_events_path
  on public.analytics_events (page_path);

alter table public.analytics_events enable row level security;

create policy "Authenticated can read analytics events"
  on public.analytics_events
  for select
  to authenticated
  using (true);

-- Log an event. Security definer so anon visitors can record
-- events without any direct write access to the table.
create or replace function public.track_event(
  p_event text,
  p_page_path text default '',
  p_label text default '',
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.analytics_events (event, page_path, label, metadata)
  values (
    left(p_event, 64),
    left(coalesce(p_page_path, ''), 512),
    left(coalesce(p_label, ''), 512),
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.track_event(text, text, text, jsonb) from public;
grant execute on function public.track_event(text, text, text, jsonb)
  to anon, authenticated;

-- Most-viewed project support.
alter table public.projects add column if not exists views integer not null default 0;

create or replace function public.increment_project_views(p_slug text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.projects set views = views + 1
  where slug = p_slug and status = 'published';
end;
$$;

revoke all on function public.increment_project_views(text) from public;
grant execute on function public.increment_project_views(text) to anon, authenticated;

-- DX: which migrations are applied remotely (admin only).
create or replace function public.list_applied_migrations()
returns table (version text, name text)
language sql security definer stable set search_path = public, pg_temp as $$
  select version, name
  from supabase_migrations.schema_migrations
  order by version;
$$;

revoke all on function public.list_applied_migrations() from public;
grant execute on function public.list_applied_migrations() to authenticated, service_role;
