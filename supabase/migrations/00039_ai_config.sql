-- 00039_ai_config.sql
-- Adds admin-configurable AI configuration to site_settings so the AI chat
-- assistant can be configured from the admin panel without code changes:
--   ai_config         - jsonb: provider chain (enabled/model/priority),
--                       knowledge-source toggles, temperature/maxTokens,
--                       and a master enable switch. Defaults to '{}' and is
--                       normalized at runtime (see normalizeAiConfig).
--   custom_knowledge  - text: free-form markdown the AI assistant always
--                       knows (bio, services, background, business details).
--
-- Column inheritance: this ALTERs an existing table (site_settings), which
-- already has explicit grants from migration 00031 — columns inherit table
-- grants automatically, so no new GRANT statements are required here.

alter table public.site_settings
  add column if not exists ai_config jsonb not null default '{}'::jsonb,
  add column if not exists custom_knowledge text not null default '';
