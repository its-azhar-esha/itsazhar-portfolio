-- 00040_admin_ai_plans.sql
-- Pending Admin AI change plans. The Admin AI never modifies data directly:
-- every request that would change the CMS is turned into a plan (a list of
-- tool actions with previews) which the owner reviews, adjusts, and then
-- explicitly approves. Plans persist so a refresh doesn't lose a draft, and
-- expire after 2 hours.
--
-- This migration CREATES a table, so per project rules it must declare the
-- Data API grants (Supabase removed automatic grants for new tables on
-- Oct 30, 2026) plus RLS and policies together.

create table if not exists public.admin_ai_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null default '',
  explanation text not null default '',
  actions jsonb not null default '[]'::jsonb,
  previews jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'applied', 'discarded', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

alter table public.admin_ai_plans enable row level security;

create policy "Owner can manage own plans"
  on public.admin_ai_plans
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_admin_ai_plans_user_status
  on public.admin_ai_plans (user_id, status);
create index if not exists idx_admin_ai_plans_expiry
  on public.admin_ai_plans (expires_at);

-- Data API grants (explicit, per the 00031 rule for new tables).
grant select, insert, update, delete on public.admin_ai_plans
  to anon, authenticated, service_role;
