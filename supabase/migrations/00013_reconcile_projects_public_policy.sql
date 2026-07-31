-- 00013_reconcile_projects_public_policy.sql
-- The remote projects table was created in the dashboard before local
-- migrations existed. Its anonymous SELECT policy filters status = 'published',
-- while the app (and migration 00001) uses status = 'active'. Reconcile the
-- remote policy so seeded/active projects are publicly visible.

drop policy if exists "Anyone can view published projects" on public.projects;

create policy "Anyone can view active projects"
  on public.projects
  for select
  using (status = 'active');
