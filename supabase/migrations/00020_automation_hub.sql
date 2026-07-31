-- ============================================================
-- Migration 00020: Automation Hub (Phase 9A)
-- resources (polymorphic content) + files + categories + collections
-- ============================================================

create table if not exists public.resource_categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 100),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description    text not null default '' check (char_length(description) <= 500),
  icon           text not null default 'box',
  display_order  integer not null default 0,
  status         text not null default 'published' check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_resource_categories
  before update on public.resource_categories
  for each row
  execute function public.handle_updated_at();

-- Polymorphic content table: one type column per content kind; new kinds are
-- new enum values + per-type metadata in `metadata`, never new tables.
create table if not exists public.resources (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('template','agent','integration','prompt','workflow','starter_kit','guide','course','ebook','tool','other')),
  title           text not null check (char_length(title) between 1 and 200),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary         text not null default '' check (char_length(summary) <= 400),
  content         text not null default '',
  category_id     uuid references public.resource_categories(id) on delete set null,
  tags            text[] not null default '{}',
  cover_image     text,
  og_image        text,
  version         text,
  changelog       jsonb not null default '[]',
  metadata        jsonb not null default '{}',
  pricing         jsonb not null default '{"model":"free"}',
  access_level    text not null default 'free' check (access_level in ('free', 'premium')),
  featured        boolean not null default false,
  display_order   integer not null default 0,
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  downloads_count integer not null default 0,
  seo_title       text,
  seo_description text,
  canonical_url   text,
  keywords        text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger set_updated_at_resources
  before update on public.resources
  for each row
  execute function public.handle_updated_at();

create table if not exists public.resource_files (
  id             uuid primary key default gen_random_uuid(),
  resource_id    uuid not null references public.resources(id) on delete cascade,
  label          text not null check (char_length(label) between 1 and 150),
  description    text not null default '' check (char_length(description) <= 300),
  file_ref       text not null,
  file_size      integer not null default 0,
  file_type      text not null default 'application/octet-stream',
  download_count integer not null default 0,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.resource_collections (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description    text not null default '' check (char_length(description) <= 500),
  cover_image    text,
  featured       boolean not null default false,
  display_order  integer not null default 0,
  status         text not null default 'published' check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_resource_collections
  before update on public.resource_collections
  for each row
  execute function public.handle_updated_at();

create table if not exists public.collection_items (
  collection_id uuid not null references public.resource_collections(id) on delete cascade,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  position      integer not null default 0,
  primary key (collection_id, resource_id)
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;
alter table public.resource_files enable row level security;
alter table public.resource_collections enable row level security;
alter table public.collection_items enable row level security;

create policy "Anyone can view published resource categories"
  on public.resource_categories for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all resource categories"
  on public.resource_categories for select to authenticated using (true);
create policy "Authenticated users can manage resource categories"
  on public.resource_categories for insert to authenticated with check (true);
create policy "Authenticated users can update resource categories"
  on public.resource_categories for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete resource categories"
  on public.resource_categories for delete to authenticated using (true);

create policy "Anyone can view published resources"
  on public.resources for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all resources"
  on public.resources for select to authenticated using (true);
create policy "Authenticated users can manage resources"
  on public.resources for insert to authenticated with check (true);
create policy "Authenticated users can update resources"
  on public.resources for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete resources"
  on public.resources for delete to authenticated using (true);

create policy "Anyone can view files of published resources"
  on public.resource_files for select to anon, authenticated
  using (exists (
    select 1 from public.resources r where r.id = resource_id and r.status = 'published'
  ));
create policy "Authenticated users can view all resource files"
  on public.resource_files for select to authenticated using (true);
create policy "Authenticated users can manage resource files"
  on public.resource_files for insert to authenticated with check (true);
create policy "Authenticated users can update resource files"
  on public.resource_files for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete resource files"
  on public.resource_files for delete to authenticated using (true);

create policy "Anyone can view published collections"
  on public.resource_collections for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all collections"
  on public.resource_collections for select to authenticated using (true);
create policy "Authenticated users can manage collections"
  on public.resource_collections for insert to authenticated with check (true);
create policy "Authenticated users can update collections"
  on public.resource_collections for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete collections"
  on public.resource_collections for delete to authenticated using (true);

create policy "Anyone can view collection items"
  on public.collection_items for select to anon, authenticated using (true);
create policy "Authenticated users can manage collection items"
  on public.collection_items for insert to authenticated with check (true);
create policy "Authenticated users can update collection items"
  on public.collection_items for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete collection items"
  on public.collection_items for delete to authenticated using (true);

-- ── Download counter (narrow, safe: anon can only bump + read ref of published) ──
create or replace function public.increment_resource_download(p_file_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref  text;
  v_res  uuid;
begin
  select rf.file_ref, rf.resource_id into v_ref, v_res
  from public.resource_files rf
  join public.resources r on r.id = rf.resource_id
  where rf.id = p_file_id and r.status = 'published';

  if v_ref is null then
    raise exception 'resource file not found or not published';
  end if;

  update public.resource_files set download_count = download_count + 1 where id = p_file_id;
  update public.resources set downloads_count = downloads_count + 1 where id = v_res;
  return v_ref;
end;
$$;

revoke all on function public.increment_resource_download(uuid) from public;
grant execute on function public.increment_resource_download(uuid) to anon, authenticated;

-- ── Seeds ────────────────────────────────────────────────────
insert into public.resource_categories (name, slug, description, icon, display_order, status) values
  ('Templates', 'templates', 'Ready-to-use automation templates you can copy and adapt.', 'layout-template', 1, 'published'),
  ('AI Agents', 'ai-agents', 'Configurable AI agent packs for real business workflows.', 'bot', 2, 'published'),
  ('Prompts & Guides', 'prompts-guides', 'Prompt libraries and step-by-step automation guides.', 'book-open', 3, 'published')
on conflict (slug) do nothing;

insert into public.resources
  (type, title, slug, summary, content, category_id, tags, version, changelog, metadata, pricing, featured, display_order, status, keywords)
values
  (
    'template',
    'Lead Qualification Agent Template',
    'lead-qualification-agent-template',
    'An n8n workflow that scores and routes inbound leads using an LLM before they ever reach your inbox.',
    '## What this does

This template turns raw inbound leads into qualified opportunities. A webhook receives the lead, an LLM extracts key details and scores the fit, then the workflow routes it to the right pipeline and sends a Slack notification.

## Nodes included

- **Webhook** — receives lead payload
- **AI Agent (Groq)** — extracts and scores the lead
- **Router** — splits qualified vs. unqualified
- **Slack** — notifies the sales channel
- **Google Sheets** — appends the lead for tracking

## Getting started

1. Import the workflow JSON into n8n.
2. Set your API keys (Groq + Slack).
3. Add your sheet ID and run a test lead.',
    (select id from public.resource_categories where slug = 'templates'),
    array['n8n', 'leads', 'sales', 'ai-agent'],
    '1.0.0',
    jsonb_build_array(jsonb_build_object('version', '1.0.0', 'date', '2026-07-31', 'notes', array['Initial release'])),
    jsonb_build_object('nodes', 5, 'runtime', 'n8n'),
    jsonb_build_object('model', 'free'),
    true,
    1,
    'published',
    array['lead qualification', 'n8n template', 'sales automation']
  ),
  (
    'agent',
    'AI Sales Agent Pack',
    'ai-sales-agent-pack',
    'A ready-to-configure AI agent persona pack for outreach, follow-up and objection handling.',
    '## What this includes

Three agent personas with system prompts, example conversations and integration notes:

1. **Outreach Agent** — first-touch messages that sound human.
2. **Follow-Up Agent** — polite persistence without being spammy.
3. **Objection Handler** — answers common objections with evidence.

## How to use

Copy the system prompt of any persona into your agent platform (n8n AI Agent node, Groq, or any chat API) and adjust the knowledge sources.',
    (select id from public.resource_categories where slug = 'ai-agents'),
    array['ai-agent', 'sales', 'prompts'],
    '1.0.0',
    jsonb_build_array(jsonb_build_object('version', '1.0.0', 'date', '2026-07-31', 'notes', array['Initial release'])),
    jsonb_build_object('personas', 3),
    jsonb_build_object('model', 'free'),
    true,
    2,
    'published',
    array['ai sales agent', 'outreach', 'follow-up']
  ),
  (
    'prompt',
    'Prompt Library — 25 Automation Prompts',
    'prompt-library-25-automation-prompts',
    'Twenty-five copy-paste prompts for scoping, designing and documenting automation projects.',
    '## What this includes

A collection of prompts organized by phase:

- **Discovery** — interview guides and requirement capture
- **Design** — workflow mapping and node selection
- **Documentation** — handover docs and SOPs
- **Troubleshooting** — error triage and debugging

Each prompt is written to work with any LLM and includes placeholders you can adapt.',
    (select id from public.resource_categories where slug = 'prompts-guides'),
    array['prompts', 'llm', 'documentation'],
    '1.0.0',
    jsonb_build_array(jsonb_build_object('version', '1.0.0', 'date', '2026-07-31', 'notes', array['Initial release'])),
    jsonb_build_object('prompts', 25),
    jsonb_build_object('model', 'free'),
    false,
    3,
    'published',
    array['prompt library', 'automation prompts', 'llm']
  ),
  (
    'guide',
    'Getting Started with n8n Automations',
    'getting-started-with-n8n-automations',
    'A beginner-friendly walkthrough of the core n8n concepts you need before building your first workflow.',
    '## Core concepts

- **Nodes** — each step in a workflow performs one job.
- **Triggers** — the event that starts a workflow (webhook, schedule, app event).
- **Connections** — data flows from node to node through edges.
- **Expressions** — `{{ }}` syntax pulls data from earlier steps.

## Your first workflow

1. Add a **Webhook** trigger and test it.
2. Connect a **Code** node and transform the payload.
3. Finish with a **Slack** notification.
4. Activate the workflow and send a real request.

## Next steps

Try the Lead Qualification template in the hub and remix it in the Workflow Playground.',
    (select id from public.resource_categories where slug = 'prompts-guides'),
    array['n8n', 'beginner', 'tutorial'],
    '1.0.0',
    jsonb_build_array(jsonb_build_object('version', '1.0.0', 'date', '2026-07-31', 'notes', array['Initial release'])),
    jsonb_build_object('minutes', 10),
    jsonb_build_object('model', 'free'),
    false,
    4,
    'published',
    array['n8n tutorial', 'beginner guide', 'automation basics']
  )
on conflict (slug) do nothing;

insert into public.resource_collections (name, slug, description, featured, display_order, status) values
  ('Getting Started Pack', 'getting-started-pack', 'Everything you need to build your first automation.', true, 1, 'published')
on conflict (slug) do nothing;

insert into public.collection_items (collection_id, resource_id, position)
select c.id, r.id, item.position
from (values
  ('getting-started-pack', 'lead-qualification-agent-template', 1),
  ('getting-started-pack', 'getting-started-with-n8n-automations', 2),
  ('getting-started-pack', 'prompt-library-25-automation-prompts', 3)
) as item(collection_slug, resource_slug, position)
join public.resource_collections c on c.slug = item.collection_slug
join public.resources r on r.slug = item.resource_slug
on conflict (collection_id, resource_id) do nothing;
