-- ============================================================
-- Migration: Seed blog posts (2026-08-01)
-- The public blog was rendering MOCK_BLOG_POSTS because the
-- blog_posts table was empty, so posts could not be managed
-- from /admin/blog. Seed the two existing mock posts plus two
-- new ones (carousel needs 3-4 posts; related-post section
-- needs variety). Mock data in src/lib/blog/mock-data.ts must
-- stay in sync with these seeds (public fallback parity).
-- ============================================================

insert into public.blog_posts
  (slug, title, excerpt, content, cover_image, categories, tags, author,
   status, featured, published_at, seo_title, seo_description, og_image,
   canonical_url, keywords)
values
  (
    'ai-agents-vs-workflows-what-your-business-actually-needs',
    'AI Agents vs. Workflows: What Your Business Actually Needs',
    'Not every automation problem needs an AI agent. Here''s how to choose between deterministic workflows and agentic systems — and when to combine both.',
    $q$
# AI Agents vs. Workflows

Two words dominate automation conversations: **workflows** and **agents**. Both eliminate manual work, but they solve different problems.

## What a workflow is

A workflow is a *deterministic* chain of steps: trigger → process → output. n8n, Zapier and Make excel here. If your process never changes shape, a workflow is the right answer.

## What an AI agent is

An agent makes *decisions* mid-task. It can plan, use tools, and recover from unexpected input. This matters when the input is unpredictable — invoices in 20 formats, emails with ambiguous requests, documents with missing fields.

## How to choose

- **Fixed process, clean data** → workflow
- **Varied input, need for judgment** → agent
- **Everything else** → a hybrid: a workflow that calls an agent at the decision point

## Bottom line

Start deterministic, add intelligence only where it pays for itself. Most businesses need 80% workflows and 20% agents.

> Want to know which parts of your operation are ready for automation? Book a free audit.
$q$,
    null,
    array['ai-agents', 'workflow-design'],
    array['ai agents', 'n8n', 'automation strategy'],
    'Azhar',
    'published',
    true,
    '2026-07-20T09:00:00Z',
    'AI Agents vs. Workflows: What Your Business Needs',
    'Workflows and AI agents solve different problems. Learn how to choose the right automation approach for your business.',
    null,
    null,
    array['ai agents', 'workflows', 'automation']
  ),
  (
    'n8n-workflow-design-principles',
    'n8n Workflow Design Principles I Use on Every Client Project',
    'Reliable automation isn''t about fancy nodes — it''s about error handling, idempotency, and boring, testable design. Here are the principles I apply.',
    $q$
# n8n Workflow Design Principles

After building dozens of production n8n workflows, I've learned what separates reliable systems from fragile demos.

## 1. Design for failure first

Every workflow *will* fail eventually. Add error branches, retry with exponential backoff, and route failures to a dedicated alert channel instead of a silent dead-end.

## 2. Make every step idempotent

A retried run must not double-create records. Use unique keys on inserts, and check-before-create on webhook triggers.

## 3. Log at the edges

Log the raw webhook payload and the final output. When something breaks at 2am, that's the only debugging surface you'll have.

## 4. Keep data out of node names

Node names are for humans. Put dynamic values in variables and item fields, not in the display title.

## 5. Test with real data

Mock data hides the exact bugs real data exposes. Build a test suite with anonymized production payloads.

> These principles are the difference between a demo and a system you can trust for years.
$q$,
    null,
    array['n8n', 'workflow-design'],
    array['n8n', 'workflow', 'reliability'],
    'Azhar',
    'published',
    false,
    '2026-07-12T09:00:00Z',
    null,
    null,
    null,
    null,
    array['n8n', 'workflow design']
  ),
  (
    'client-onboarding-automation-n8n-blueprint',
    'Client Onboarding Automation: An n8n Blueprint That Saves Hours a Week',
    'A client''s first 30 days decide the relationship. Here''s the n8n blueprint I use to cut onboarding busywork by hours every week.',
    $q$
# Client Onboarding Automation

A client's first 30 days decide the relationship. Here's the n8n blueprint I use to cut onboarding busywork by hours every week.

## The problem

Onboarding is email tennis: kickoff notes, account creation, questionnaire follow-ups, meeting scheduling, contract signatures. None of it is hard — it's just *repetitive*.

## The blueprint

1. **Trigger on signature** — a webhook from your contract tool starts the flow.
2. **Create the workspace** — provision CRM records, project folders and docs in one shot.
3. **Collect the brief** — a form link goes out with a deadline; missing answers get an automatic nudge after 48 hours.
4. **Schedule the kickoff** — offer 3 meeting slots; the booking node blocks the winner in your calendar.
5. **Notify the team** — every step posts a summary to the #onboarding channel.

## What to automate first

- Anything that happens **the same way** every time — automate it.
- Anything that needs **judgment** — keep a human in the loop.

> Start with steps 2 and 4: they're the highest-frequency, lowest-risk wins.

## Bottom line

A solid onboarding workflow pays for itself in the first month — mostly in sanity, measurably in hours.
$q$,
    null,
    array['n8n', 'workflow-design'],
    array['n8n', 'client onboarding', 'automation'],
    'Azhar',
    'published',
    false,
    '2026-07-25T09:00:00Z',
    'Client Onboarding Automation: An n8n Blueprint',
    'Automate client onboarding with n8n: workspace provisioning, brief collection, kickoff scheduling and team notifications.',
    null,
    null,
    array['n8n', 'client onboarding', 'automation']
  ),
  (
    'ai-chatbots-book-meetings-without-hallucinations',
    'AI Chatbots That Book Meetings (Without the Hallucination Problem)',
    'Open-ended LLM chat is great for content, terrible for conversion. Here''s the guarded flow I use to build chatbots that actually qualify and book.',
    $q$
# AI Chatbots That Actually Book Meetings

Chatbots promise to qualify and book your leads 24/7. Most fail because they improvise instead of following a script. Here's how I build ones that close.

## Why most chatbots fail

Open-ended chat with an LLM is great for content, terrible for conversion. Without a guardrail, the bot writes polite fiction instead of qualifying a lead.

## The reliable pattern

- **A strict flow, not free chat** — the conversation follows a decision tree; the LLM only fills in the gaps.
- **Data collection first** — budget, timeline and use case are captured as structured fields before any promise is made.
- **A human handoff point** — the bot books or flags, never decides. Anything outside its script routes to a real person.

## Guardrails that matter

1. Constrain the LLM with a system prompt that forbids pricing promises.
2. Validate extracted data against an expected schema before the handoff.
3. Log every conversation — you'll retrain the flow, not the model.

## When to skip the bot

If you get fewer than 10 inbound leads a month, a form is faster. Automation should serve volume, not create ceremony.

> The best chatbot in your stack is the one that books a meeting it can keep.
$q$,
    null,
    array['ai-agents', 'workflow-design'],
    array['ai agents', 'chatbots', 'meeting booking'],
    'Azhar',
    'published',
    false,
    '2026-07-28T09:00:00Z',
    'AI Chatbots That Book Meetings Without Hallucinations',
    'A guardrailed flow for AI chatbots that qualify leads and book meetings — with the LLM constrained, never improvising.',
    null,
    null,
    array['ai agents', 'chatbots', 'meeting booking']
  )
on conflict (slug) do nothing;
