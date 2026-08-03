-- ============================================================
-- Migration: Cleanup literal '{}' canonical_url values in projects
-- Portfolio CMS — 00012 seeded `'{}'` (a literal text string) as
-- canonical_url for every project, which emitted broken <link
-- rel="canonical" href="{}"> tags. Set them back to NULL.
-- ============================================================

update public.projects
  set canonical_url = null
  where canonical_url = '{}';
