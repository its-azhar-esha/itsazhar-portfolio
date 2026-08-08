-- ============================================================
-- Migration: Blog post sources (2026-08-08)
-- - blog_posts.sources: jsonb array of reference links shown on
--   the public post page, e.g. [{"title": "OpenAI Docs",
--   "url": "https://platform.openai.com"}]. Managed from the
--   blog form (add/edit/remove/reorder). Same table, so existing
--   grants and RLS policies cover the new column automatically.
-- ============================================================

alter table public.blog_posts
  add column if not exists sources jsonb not null default '[]'::jsonb;
