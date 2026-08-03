-- ============================================================
-- Migration: Convert future_scope from text to text[]
-- Portfolio CMS — supports reorderable list items like key_features
-- ============================================================

-- Convert existing single text values to arrays: null → '{}', 'some text' → ARRAY['some text']
alter table public.projects
  alter column future_scope type text[]
  using case
    when future_scope is null then '{}'::text[]
    else array[future_scope]::text[]
  end;

-- Set default to empty array for new rows
alter table public.projects
  alter column future_scope set default '{}'::text[];

-- Existing Data API grants from 00031 continue to cover the column type change.
