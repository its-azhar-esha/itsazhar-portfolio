-- ============================================================
-- Migration 00021: Workflow Playground (Phase 9B)
-- node library + categories + templates + shared user workflows
-- ============================================================

create table if not exists public.workflow_node_types (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name           text not null check (char_length(name) between 1 and 100),
  category       text not null check (category in ('triggers', 'ai', 'data', 'logic', 'actions')),
  icon           text not null default 'circle',
  color          text not null default '#8b5cf6',
  description    text not null default '' check (char_length(description) <= 400),
  config_schema  jsonb not null default '{}',
  default_config jsonb not null default '{}',
  display_order  integer not null default 0,
  status         text not null default 'published' check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_workflow_node_types
  before update on public.workflow_node_types
  for each row
  execute function public.handle_updated_at();

create table if not exists public.workflow_categories (
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

create or replace trigger set_updated_at_workflow_categories
  before update on public.workflow_categories
  for each row
  execute function public.handle_updated_at();

create table if not exists public.workflow_templates (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 200),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description    text not null default '' check (char_length(description) <= 500),
  category_id    uuid references public.workflow_categories(id) on delete set null,
  difficulty     text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  tags           text[] not null default '{}',
  thumbnail      text,
  nodes          jsonb not null default '[]',
  edges          jsonb not null default '[]',
  canvas         jsonb not null default '{}',
  walkthrough    jsonb not null default '[]',
  featured       boolean not null default false,
  display_order  integer not null default 0,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  views_count    integer not null default 0,
  seo_title      text,
  seo_description text,
  keywords       text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_workflow_templates
  before update on public.workflow_templates
  for each row
  execute function public.handle_updated_at();

create table if not exists public.user_workflows (
  id          uuid primary key default gen_random_uuid(),
  share_code  text not null unique check (share_code ~ '^[a-zA-Z0-9]{8}$'),
  title       text not null default 'Untitled workflow' check (char_length(title) <= 200),
  name        text check (name is null or char_length(name) between 1 and 100),
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nodes       jsonb not null default '[]',
  edges       jsonb not null default '[]',
  canvas      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger set_updated_at_user_workflows
  before update on public.user_workflows
  for each row
  execute function public.handle_updated_at();

-- ── Row Level Security ──────────────────────────────────────
alter table public.workflow_node_types enable row level security;
alter table public.workflow_categories enable row level security;
alter table public.workflow_templates enable row level security;
alter table public.user_workflows enable row level security;

create policy "Anyone can view published node types"
  on public.workflow_node_types for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all node types"
  on public.workflow_node_types for select to authenticated using (true);
create policy "Authenticated users can manage node types"
  on public.workflow_node_types for insert to authenticated with check (true);
create policy "Authenticated users can update node types"
  on public.workflow_node_types for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete node types"
  on public.workflow_node_types for delete to authenticated using (true);

create policy "Anyone can view published workflow categories"
  on public.workflow_categories for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all workflow categories"
  on public.workflow_categories for select to authenticated using (true);
create policy "Authenticated users can manage workflow categories"
  on public.workflow_categories for insert to authenticated with check (true);
create policy "Authenticated users can update workflow categories"
  on public.workflow_categories for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete workflow categories"
  on public.workflow_categories for delete to authenticated using (true);

create policy "Anyone can view published templates"
  on public.workflow_templates for select to anon, authenticated
  using (status = 'published');
create policy "Authenticated users can view all templates"
  on public.workflow_templates for select to authenticated using (true);
create policy "Authenticated users can manage templates"
  on public.workflow_templates for insert to authenticated with check (true);
create policy "Authenticated users can update templates"
  on public.workflow_templates for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete templates"
  on public.workflow_templates for delete to authenticated using (true);

-- Visitors can only SAVE shared workflows; reads go through the RPC below.
create policy "Anyone can save a shared workflow"
  on public.user_workflows for insert to anon, authenticated
  with check (true);
create policy "Authenticated users can view all shared workflows"
  on public.user_workflows for select to authenticated using (true);
create policy "Authenticated users can delete shared workflows"
  on public.user_workflows for delete to authenticated using (true);

-- Shared-workflow reader: returns ONLY the row matching the requested code.
create or replace function public.get_shared_workflow(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_workflows%rowtype;
begin
  select * into v_row from public.user_workflows where share_code = p_code;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'id', v_row.id,
    'share_code', v_row.share_code,
    'title', v_row.title,
    'name', v_row.name,
    'nodes', v_row.nodes,
    'edges', v_row.edges,
    'canvas', v_row.canvas,
    'created_at', v_row.created_at
  );
end;
$$;

revoke all on function public.get_shared_workflow(text) from public;
grant execute on function public.get_shared_workflow(text) to anon, authenticated;

-- Template view counter (narrow, safe).
create or replace function public.increment_workflow_template_views(p_template_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.workflow_templates set views_count = views_count + 1
  where id = p_template_id and status = 'published';
$$;

revoke all on function public.increment_workflow_template_views(uuid) from public;
grant execute on function public.increment_workflow_template_views(uuid) to anon, authenticated;

-- ── Seeds: node library ─────────────────────────────────────
insert into public.workflow_node_types
  (key, name, category, icon, color, description, config_schema, default_config, display_order, status)
values
  ('webhook', 'Webhook', 'triggers', 'radio', '#3b82f6', 'Starts the workflow when an HTTP request hits your endpoint.', jsonb_build_object('path', 'text'), jsonb_build_object('path', ''), 1, 'published'),
  ('schedule', 'Schedule', 'triggers', 'calendar-clock', '#3b82f6', 'Starts the workflow on a fixed interval or cron schedule.', jsonb_build_object('cron', 'text'), jsonb_build_object('cron', '0 9 * * *'), 2, 'published'),
  ('ai_agent', 'AI Agent', 'ai', 'bot', '#8b5cf6', 'An LLM-powered agent that follows your system prompt.', jsonb_build_object('prompt', 'textarea'), jsonb_build_object('prompt', 'You are a helpful assistant.'), 3, 'published'),
  ('ai_chat', 'AI Chat', 'ai', 'message-square', '#8b5cf6', 'Single-turn LLM call for extraction, rewriting or scoring.', jsonb_build_object('prompt', 'textarea'), jsonb_build_object('prompt', ''), 4, 'published'),
  ('http_request', 'HTTP Request', 'data', 'globe', '#0ea5e9', 'Calls any REST API and passes the response downstream.', jsonb_build_object('url', 'text', 'method', 'select'), jsonb_build_object('url', '', 'method', 'GET'), 5, 'published'),
  ('data_store', 'Data Store', 'data', 'database', '#0ea5e9', 'Reads or writes structured rows in a simple store.', jsonb_build_object('operation', 'select'), jsonb_build_object('operation', 'read'), 6, 'published'),
  ('code', 'Code Step', 'data', 'code-2', '#f59e0b', 'Runs JavaScript to transform or validate data.', jsonb_build_object('code', 'textarea'), jsonb_build_object('code', 'return items;'), 7, 'published'),
  ('filter', 'Filter', 'logic', 'filter', '#ef4444', 'Passes data only when the condition is true.', jsonb_build_object('condition', 'text'), jsonb_build_object('condition', ''), 8, 'published'),
  ('router', 'Router', 'logic', 'git-branch', '#ef4444', 'Branches the flow into different paths by rules.', jsonb_build_object('rules', 'text'), jsonb_build_object('rules', ''), 9, 'published'),
  ('slack', 'Slack', 'actions', 'message-circle', '#22c55e', 'Posts a message to a Slack channel.', jsonb_build_object('channel', 'text'), jsonb_build_object('channel', '#general'), 10, 'published'),
  ('telegram', 'Telegram', 'actions', 'send', '#22c55e', 'Sends a message to a Telegram chat.', jsonb_build_object('chat_id', 'text'), jsonb_build_object('chat_id', ''), 11, 'published'),
  ('email', 'Email', 'actions', 'mail', '#22c55e', 'Sends an email to one or more recipients.', jsonb_build_object('to', 'text'), jsonb_build_object('to', ''), 12, 'published')
on conflict (key) do nothing;

insert into public.workflow_categories (name, slug, description, icon, display_order, status) values
  ('Automation Basics', 'automation-basics', 'Simple start-to-finish automations for everyday work.', 'layout-template', 1, 'published'),
  ('AI Agents', 'ai-agents', 'Workflows built around LLM-powered agents.', 'bot', 2, 'published'),
  ('Data Pipelines', 'data-pipelines', 'Move, clean and sync data between tools.', 'database', 3, 'published')
on conflict (slug) do nothing;

-- ── Seeds: templates (portable node/edge JSON) ──────────────
insert into public.workflow_templates
  (title, slug, description, category_id, difficulty, tags, nodes, edges, canvas, walkthrough, featured, display_order, status, keywords)
values
  (
    'Lead Scoring & Slack Alert',
    'lead-scoring-slack-alert',
    'Score inbound leads with an LLM and alert your team on the good ones.',
    (select id from public.workflow_categories where slug = 'ai-agents'),
    'beginner',
    array['leads', 'ai', 'slack'],
    jsonb_build_array(
      jsonb_build_object('id', 'webhook-1', 'type', 'webhook', 'position', jsonb_build_object('x', 0, 'y', 0), 'config', jsonb_build_object('path', 'lead-in')),
      jsonb_build_object('id', 'ai-1', 'type', 'ai_chat', 'position', jsonb_build_object('x', 260, 'y', 0), 'config', jsonb_build_object('prompt', 'Score this lead 1-10 and return JSON with score, reason. Lead: {{webhook-1.body}}')),
      jsonb_build_object('id', 'router-1', 'type', 'router', 'position', jsonb_build_object('x', 520, 'y', 0), 'config', jsonb_build_object('rules', 'score >= 7 -> high, else low')),
      jsonb_build_object('id', 'slack-1', 'type', 'slack', 'position', jsonb_build_object('x', 780, 'y', -60), 'config', jsonb_build_object('channel', '#sales-leads'))
    ),
    jsonb_build_array(
      jsonb_build_object('id', 'e1', 'source', 'webhook-1', 'target', 'ai-1'),
      jsonb_build_object('id', 'e2', 'source', 'ai-1', 'target', 'router-1'),
      jsonb_build_object('id', 'e3', 'source', 'router-1', 'target', 'slack-1')
    ),
    jsonb_build_object('bgColor', '#0c0a14'),
    jsonb_build_array(
      jsonb_build_object('title', 'Start', 'description', 'Every flow needs a trigger. The Webhook node waits for an incoming HTTP request.'),
      jsonb_build_object('title', 'Score it', 'description', 'The AI Chat node reads the lead payload and returns a 1-10 score with a reason.'),
      jsonb_build_object('title', 'Route it', 'description', 'The Router sends high scores to the sales Slack channel.'),
      jsonb_build_object('title', 'Extend it', 'description', 'Add a Data Store node to log every lead for later analysis.')
    ),
    true,
    1,
    'published',
    array['lead scoring', 'ai', 'slack alert']
  ),
  (
    'AI Content Brief Generator',
    'ai-content-brief-generator',
    'Turn a topic idea into a structured content brief with outline, audience and angle.',
    (select id from public.workflow_categories where slug = 'ai-agents'),
    'beginner',
    array['content', 'ai', 'marketing'],
    jsonb_build_array(
      jsonb_build_object('id', 'webhook-1', 'type', 'webhook', 'position', jsonb_build_object('x', 0, 'y', 0), 'config', jsonb_build_object('path', 'brief-in')),
      jsonb_build_object('id', 'ai-1', 'type', 'ai_agent', 'position', jsonb_build_object('x', 260, 'y', 0), 'config', jsonb_build_object('prompt', 'You are a content strategist. Turn the topic into a brief with outline, target audience, angle and 3 headline options. Topic: {{webhook-1.body.topic}}')),
      jsonb_build_object('id', 'email-1', 'type', 'email', 'position', jsonb_build_object('x', 520, 'y', 0), 'config', jsonb_build_object('to', '{{webhook-1.body.email}}'))
    ),
    jsonb_build_array(
      jsonb_build_object('id', 'e1', 'source', 'webhook-1', 'target', 'ai-1'),
      jsonb_build_object('id', 'e2', 'source', 'ai-1', 'target', 'email-1')
    ),
    jsonb_build_object('bgColor', '#0c0a14'),
    jsonb_build_array(
      jsonb_build_object('title', 'Trigger', 'description', 'A webhook receives the topic and the creator''s email.'),
      jsonb_build_object('title', 'Generate', 'description', 'The AI Agent persona applies content-strategy best practices.'),
      jsonb_build_object('title', 'Deliver', 'description', 'The brief is emailed back automatically.')
    ),
    true,
    2,
    'published',
    array['content brief', 'ai agent', 'marketing']
  ),
  (
    'Daily Digest & Store',
    'daily-digest-and-store',
    'Collect data from an API every morning, clean it with a code step and archive it.',
    (select id from public.workflow_categories where slug = 'data-pipelines'),
    'intermediate',
    array['data', 'scheduler', 'archive'],
    jsonb_build_array(
      jsonb_build_object('id', 'schedule-1', 'type', 'schedule', 'position', jsonb_build_object('x', 0, 'y', 0), 'config', jsonb_build_object('cron', '0 9 * * *')),
      jsonb_build_object('id', 'http-1', 'type', 'http_request', 'position', jsonb_build_object('x', 260, 'y', 0), 'config', jsonb_build_object('url', 'https://api.example.com/daily', 'method', 'GET')),
      jsonb_build_object('id', 'code-1', 'type', 'code', 'position', jsonb_build_object('x', 520, 'y', 0), 'config', jsonb_build_object('code', 'return items.map(i => ({ id: i.id, value: Number(i.value) }));')),
      jsonb_build_object('id', 'store-1', 'type', 'data_store', 'position', jsonb_build_object('x', 780, 'y', 0), 'config', jsonb_build_object('operation', 'write'))
    ),
    jsonb_build_array(
      jsonb_build_object('id', 'e1', 'source', 'schedule-1', 'target', 'http-1'),
      jsonb_build_object('id', 'e2', 'source', 'http-1', 'target', 'code-1'),
      jsonb_build_object('id', 'e3', 'source', 'code-1', 'target', 'store-1')
    ),
    jsonb_build_object('bgColor', '#0c0a14'),
    jsonb_build_array(
      jsonb_build_object('title', 'Schedule', 'description', 'Runs every day at 09:00 server time.'),
      jsonb_build_object('title', 'Fetch', 'description', 'The HTTP Request node pulls the latest data.'),
      jsonb_build_object('title', 'Clean', 'description', 'A code step normalizes the payload.'),
      jsonb_build_object('title', 'Archive', 'description', 'The data store keeps a growing history.')
    ),
    false,
    3,
    'published',
    array['data pipeline', 'scheduler', 'archive']
  )
on conflict (slug) do nothing;
