-- ============================================================
-- Migration: Fix projects.industry array drift (2026-07-31)
-- The hosted projects table predates 00001, so `industry` remained
-- `text` instead of the declared `text[]`. Seed rows (00012) stored
-- PostgreSQL array literal strings ('{"Logistics", "Transportation"}'),
-- which PostgREST returns as a plain string. Admin forms map
-- industry as string[] -> `.filter(...)` threw on a string, so any
-- project edit crashed into the admin error boundary
-- ("Dashboard error: The dashboard failed to load").
-- This migration converts the column to text[] and swaps the index
-- to GIN (as 00001 originally intended) for `@>` contains queries.
-- ============================================================

create or replace function public._migrate_industry_to_array(val text)
returns text[]
language plpgsql immutable
as $$
begin
  if val is null or val = '' then
    return '{}'::text[];
  end if;
  if val like '{%' then
    begin
      return val::text[];
    exception when others then
      return array[val];
    end;
  end if;
  return array[val];
end;
$$;

alter table public.projects
  alter column industry drop default;

alter table public.projects
  alter column industry type text[]
  using public._migrate_industry_to_array(industry);

alter table public.projects
  alter column industry set default '{}'::text[];

drop index if exists idx_projects_industry;

create index if not exists idx_projects_industry
  on public.projects using gin (industry);

drop function public._migrate_industry_to_array(text);
