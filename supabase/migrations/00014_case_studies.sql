-- ============================================================
-- Migration: Create case_studies table (Phase 8E)
-- "From manual to automated" section — admin-managed case studies
-- ============================================================

create table if not exists public.case_studies (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title          text not null check (char_length(title) between 1 and 200),
  subtitle       text not null default '' check (char_length(subtitle) <= 100),
  challenge      text not null check (char_length(challenge) between 1 and 2000),
  solution       text not null check (char_length(solution) between 1 and 2000),
  workflow       text[] not null default '{}',
  impact         text not null check (char_length(impact) between 1 and 2000),
  icon           text not null default 'fleet' check (icon in ('fleet', 'lease', 'education')),
  display_order  integer not null default 0,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace trigger set_updated_at_case_studies
  before update on public.case_studies
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.case_studies enable row level security;

create policy "Anyone can view published case studies"
  on public.case_studies
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Authenticated users can view all case studies"
  on public.case_studies
  for select
  to authenticated
  using (true);

create policy "Authenticated users can create case studies"
  on public.case_studies
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update case studies"
  on public.case_studies
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete case studies"
  on public.case_studies
  for delete
  to authenticated
  using (true);

-- Seed: the three original case studies shown on the homepage.
insert into public.case_studies
  (slug, title, subtitle, challenge, solution, workflow, impact, icon, display_order, status)
values
  (
    'fleet-intelligence-system',
    'Fleet Intelligence System',
    'Logistics AI',
    'Manual fleet monitoring was reactive, slow, and prone to missed incidents.',
    'A real-time AI system that analyzes fleet activity, detects risks, and provides instant operational insights.',
    array[
      'Tracks vehicle and driver data',
      'AI analyzes route behavior, delays, and anomalies',
      'Automatically flags issues and sends alerts',
      'Built with n8n + Supabase + LLM-based analysis'
    ],
    'Transformed manual fleet monitoring into an intelligent automated safety system.',
    'fleet',
    1,
    'published'
  ),
  (
    'lease-intelligence-system',
    'Lease Intelligence System',
    'Real Estate AI',
    'Manual lease review was slow, inconsistent, and easy to miss critical clauses.',
    'Automated extraction of important lease information from PDFs with structured summaries.',
    array[
      'Extracts clauses like rent, renewal, and termination',
      'Processes PDF documents automatically',
      'Generates structured summaries',
      'Stores business data securely'
    ],
    'Reduces manual document review and helps prevent missed contract details.',
    'lease',
    2,
    'published'
  ),
  (
    'education-automation-system',
    'Education Automation System',
    'EdTech SaaS',
    'Manual school processes were scattered, error-prone, and difficult to scale.',
    'An automation-first system built using n8n workflows for school operations.',
    array[
      'Handles student/admin workflows',
      'Automates notifications',
      'Processes data using AI',
      'Uses PostgreSQL database'
    ],
    'Shows how scalable SaaS-like systems can be created using automation-first architecture.',
    'education',
    3,
    'published'
  )
on conflict (slug) do nothing;
