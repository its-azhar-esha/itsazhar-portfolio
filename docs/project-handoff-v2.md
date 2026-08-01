# Project Handoff v2 — Official Documentation

## 1. Project Overview

### Purpose

Production portfolio website with a full content-management system for a
freelance AI-automation specialist (Azhar Mahmud Alif). Public marketing site

- authenticated admin CMS, running on Next.js App Router and Supabase.

### Goals

- Fast, static-first public pages (hero, about, projects, services, contact)
- Full CMS: projects, hero/about content, page-level SEO, services, media library
- Production hardening: auth-gated admin, RLS everywhere, security headers, CSP
- Reusable media system (`media:<uuid>` references) ready for future modules (Blog, etc.)

### Tech Stack

| Layer         | Technology                                                                                |
| ------------- | ----------------------------------------------------------------------------------------- |
| Framework     | Next.js 16.2.12 (Turbopack), App Router, React 19.2.4                                     |
| Language      | TypeScript 5 (strict), `@/*` path alias → `./src/*`                                       |
| Styling       | Tailwind CSS v4, tw-animate-css, shadcn-style UI components                               |
| Backend       | Supabase (Postgres + Auth + Storage), `@supabase/ssr` 0.12.4, `supabase-js` 2.111         |
| Validation    | Zod 4.4.3                                                                                 |
| Animation     | framer-motion 12                                                                          |
| Icons         | lucide-react                                                                              |
| UI primitives | Radix UI (accordion, avatar, label, separator, slot, switch, tabs)                        |
| Misc          | next-themes, `@next/third-parties/google`, class-variance-authority, clsx, tailwind-merge |
| Quality       | ESLint 9 (flat config), Prettier 3 + tailwind plugin, Husky + lint-staged                 |
| Deploy        | Vercel (no `vercel.json`; default Next.js preset)                                         |

### Current Completion Status

- Phases complete: Engineering Foundation → Auth → CMS Core → Project CMS →
  Production Hardening → SEO CMS → Services CMS → Media Infrastructure (8A) →
  Media Integration (8B) → Image Optimization & Cleanup (8C) → CMS
  Reconciliation + Admin AI & Settings (8D, 2026-07-31)
- Build: green, 0 TypeScript errors, 0 lint errors (verified after Phase 8D
  merge to main, commit e04f8a2)
- Production: live at `itsazhar-portfolio.vercel.app`, serving the full latest
  build (all routes verified 200, 2026-07-31)

## 2. Architecture

### App Router structure

Single `src/app/` tree (no `app/` + `src/app/` conflict). Three logical areas:

- **Public** — `src/app/(public)/` route group: marketing pages, `layout.tsx`
  with Navbar/Footer/ChatProvider, nested `about/layout.tsx`,
  `projects/layout.tsx`, `not-found.tsx`, `error.tsx`, `loading.tsx`, `offline/`
- **Admin** — `src/app/admin/`: own `layout.tsx` (shell/sidebar), `login/`,
  content/hero, content/about, projects CRUD, seo CRUD, services CRUD, media,
  settings, ai. Protected by the proxy (see §3).
- **Global** — `src/app/layout.tsx` (html/body, fonts, ThemeProvider, analytics),
  `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`, `favicon.ico`,
  `api/chat/route.ts`.

### Public/Admin route groups

Public routes live inside the `(public)` route group; route groups do not
change URLs (verified in `.next/routes-manifest.json`). The admin group has no
group folder; it is a physical `admin/` segment protected by the proxy matcher.

### Repository Pattern

Each module owns a server-only repository (`src/lib/<module>/repository.ts`)
that wraps Supabase queries and returns `Result<T>`:

- `projects/repository.ts`, `content/repository.ts`, `seo/repository.ts`,
  `services/repository.ts`, `media/repository.ts`, plus read helpers
  `hero/public.ts`, `about/public.ts`, `projects/public.ts`
- Repositories are the only code touching the database tables
- `src/lib/supabase/server.ts` (`createClient`) is the shared server client
- Public read helpers fall back to mock data (`mock-data.ts`) when Supabase is
  unavailable, so the site never crashes without env/DB

### Server Actions

All mutations are `"use server"` actions in `src/lib/<module>/actions.ts`:

- Authorize via `supabase.auth.getUser()` (never trust the client)
- Validate input with Zod schemas
- Call repository, return `Result<T>`, log failures via `src/lib/logger.ts`
- `revalidatePath` after mutations
- Client components import actions **directly from the module's `actions.ts`**,
  never from the module barrel (barrels re-export repositories → `next/headers`
  → client boundary build error)

### Validation architecture

Zod schemas in `src/lib/validation/schemas/<module>.ts`, re-exported through
`src/lib/validation/index.ts`. Client components may import schemas from the
barrel (schemas are isomorphic, no server imports). Rules:

- All server action inputs pass through a schema (`safeParse`)
- DB-shaped schemas (`createXxxSchema`) mirror `src/database.types.ts`
- `updateXxxSchema` = partial of create
- Media fields use `mediaUrlOrReferenceSchema` (URL or `media:<uuid>`)

### Shared types

- `src/types/<module>.ts` — domain types (hero, about, project, service, seo,
  media, content, navigation, social)
- `src/database.types.ts` — hand-synced Supabase generated types (see §4 note)
- `src/types/index.ts` barrel (types-only)

### Shared UI philosophy

- `src/components/ui/` — shadcn-style primitives (button, input, card, label,
  tabs, switch, badge, accordion, avatar, separator, textarea)
- `src/components/media/` — media library components (see §6)
- `src/components/admin/` — admin-only composite components
- `src/components/<section>.tsx` — public landing sections
- Consistency: dark-only theme, `border-border/40`, `rounded-lg`, size `sm`
  admin buttons, `text-muted-foreground` secondary text

### Result\<T> pattern

`src/lib/result.ts`:

```ts
type Result<T> = { success: true; data: T } | { success: false; error: string };
ok(data) / fail(error);
```

All repositories and actions return `Result<T>`; callers branch on
`result.success`. Never throw across boundaries; log with
`src/lib/logger.ts` (`logError`, `logWarn`).

## 3. Authentication

### Supabase SSR auth

- Browser client: `src/lib/supabase/client.ts`
- Server client: `src/lib/supabase/server.ts` (`cookies()` from
  `next/headers`; missing env → returns `null`-typed stub, callers degrade)
- Admin client: `src/lib/supabase/admin.ts` (service role, server-only)
- Middleware client: `src/lib/supabase/middleware.ts`

### Proxy (Next.js 16 middleware)

`src/proxy.ts` — default-export `proxy(request)`:

- Matcher: `["/admin/:path*", "/admin"]` — **public routes never execute it**
- Creates the SSR client per request, then `supabase.auth.getUser()` (network
  call; failures treated as unauthenticated)
- Unauthenticated → redirect `/admin/login`; authenticated at login →
  redirect `/admin`; otherwise return the `NextResponse.next()` from the
  middleware client so cookie refreshes are preserved
- **POST (server action) requests are never redirected** — a transient
  `getUser()` failure on an action POST caused RSC errors (digest
  `3379654745` in production); actions enforce auth themselves and return
  `fail("Authentication required.")`. Only GET/HEAD navigations redirect.
- Missing env → middleware client returns `null` supabase + `NextResponse.next()`

### Cookie lifecycle

- Cookies are read via `request.cookies.getAll()` and written via
  `setAll()` into the shared `supabaseResponse`, **never recreated** after
  auth calls (see fixed bug below)
- Server components use `cookies()` + `setAll` with try/catch (set throws in
  Server Components; ignored, revalidated on next request)

### Session refresh

`supabase.auth.getUser()` in proxy and server actions refreshes expired
sessions automatically (Supabase SSR does this transparently). No custom
refresh logic.

### Admin protection

- Proxy redirects unauthenticated users away from `/admin/*`
- Every mutation action independently verifies `auth.getUser()`
- RLS enforces anon-read vs authed-write at the database level (see §4)

### Fixed production bugs (and why)

1. **Middleware response mismatch (infinite refresh loop)**
   Original bug: middleware reassigned `supabaseResponse` (`let
supabaseResponse = NextResponse.next(...)` then `supabaseResponse =
NextResponse.next(...)` again after auth calls). Reassignment discarded
   cookie-update metadata and broke session refresh, causing infinite
   redirect loops between `/admin` and `/admin/login`.
   Fix: `const supabaseResponse = NextResponse.next({ request })` created
   once and returned at the end; `setAll` writes into that same object.
   **Why it exists:** session cookie updates must ride along with the final
   response; any other response object drops them.

2. **Service worker stale-cache issue**
   `public/sw.js` is network-first but **only caches status-200
   `type:"basic"` responses** (so it can never serve a cached error page),
   and `install` precaches `/`, `/projects`, `/about`, `/services`,
   `/contact`, `/offline` via `cache.addAll`. If any precache URL returns
   non-200 at install time, the install rejects and the old service worker
   keeps serving stale content. Also, after the `(public)` migration the SW
   was not re-versioned (`CACHE = "azhar-v1"` unchanged).
   **Why the fix exists:** to prevent the browser from serving stale
   pre-migration pages and to avoid masking server changes with old caches.
   Manual action needed: bump `CACHE` version on deploy and unregister
   stale SWs (DevTools → Application → Service Workers).
   **2026-07-31 update:** cache bumped to `azhar-v3`; `/admin/*` and
   `/api/*` requests are now network-only (never served from cache, avoiding
   stale admin UI and masked API failures).

3. **Refresh loop (auth)**
   Related to #1 — caused by the same response reassignment + `getUser`
   returning errors being treated as unauthenticated, chaining redirects.
   Fixed by the shared-response pattern; `getUser()` failures now degrade to
   "unauthenticated" without redirect loops.

4. **Media upload failed in production (RSC error)**
   Production CSP lacked the Supabase origin in `connect-src`/`img-src`, so
   browser uploads (storage POST) and rendered storage URLs were blocked.
   Fixed in `next.config.ts` by appending
   `https://quekecvmdbzpxqglztsa.supabase.co` to both directives (deploy
   `28aed50`). Uploads also failed with a Next 16 CSRF digest on server
   actions; the proxy now never redirects POSTs (see §3).

## 4. Database

All migrations in `supabase/migrations/`. `src/database.types.ts` is
hand-synced with these migrations (regenerate via `supabase gen types`).

| #     | File                                         | Purpose                                    | Tables                                                                                                                                                        | RLS                                                                                                                               |
| ----- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 00001 | `00001_create_projects.sql`                  | Projects table                             | `projects`                                                                                                                                                    | anon: select active only; authed: full CRUD. Unique slug, status/featured/order/industry/created_at indexes, `updated_at` trigger |
| 00002 | `00002_add_project_rich_fields.sql`          | Rich fields for public detail pages        | alters `projects` (adds rich content columns)                                                                                                                 | inherited from 00001                                                                                                              |
| 00003 | `00003_create_content_entries.sql`           | Reusable content store                     | `content_entries` (key unique, title, JSONB content, status)                                                                                                  | anon: published only; authed: full CRUD. Indexes on key/status/content                                                            |
| 00004 | `00004_create_seo_metadata.sql`              | SEO CMS                                    | `seo_metadata` (page_key unique, title ≤70, description ≤160, keywords[], og_image, canonical_url, robots)                                                    | anon: read; authed: insert/update/delete. Seeds default entries for home/about/projects/services                                  |
| 00005 | `00005_create_services.sql`                  | Services CMS                               | `services` (slug unique, status, featured, display_order, JSONB content)                                                                                      | anon: published only; authed: full CRUD. `updated_at` trigger                                                                     |
| 00006 | `00006_create_media_files.sql`               | Media library                              | `media` bucket (public) + `media_files` (filename, storage_path, public_url nullable, mime, size, width/height, alt_text, caption)                            | anon: read; authed: CRUD. Storage object policies (public read, authed upload/update/delete). 10 MB image-only enforcements       |
| 00007 | `00007_reconcile_remote_projects.sql`        | Reconcile dashboard-created `projects`     | adds `thumbnail`, `images`, `client`, `demo_url`, `keywords`, `"order"` to the remote table                                                                   | inherited                                                                                                                         |
| 00008 | `00008_create_site_settings.sql`             | Site-wide settings                         | `site_settings` (key unique, JSONB settings, updated_at)                                                                                                      | anon: read; authed: update. Seeded default row (analytics IDs null, toggles on)                                                   |
| 00009 | `00009_leads.sql`                            | Lead CRM                                   | `leads` (name, email, phone, message, source, status `new/contacted/closed`, created_at)                                                                      | anon: insert only; authed: select/update/delete. `updated_at` trigger, status index                                               |
| 00011 | `00011_reconcile_projects_status_check.sql`  | Align remote projects status constraint    | remote constraint was `('draft','published','archived')` (dashboard-created); now `('draft','active','published','archived')` so app `'active'` works         | inherited                                                                                                                         |
| 00012 | `00012_seed_projects_and_services.sql`       | Seed real rows from mock data              | inserts 5 projects (fleet-guard, lease-intelligence, document-intelligence, client-onboarding, product-matcher) + 6 services, `on conflict (slug) do nothing` | inherited                                                                                                                         |
| 00013 | `00013_reconcile_projects_public_policy.sql` | Reconcile remote anonymous projects policy | remote policy filtered `status='published'`; recreated as `'active'` to match app queries                                                                     | anon: active only; authed: full CRUD                                                                                              |

**Constraints & relationships:** no foreign keys between CMS tables (they are
decoupled by design — media references are string-based `media:<uuid>`).
Unique constraints: `projects.slug`, `content_entries.key`,
`seo_metadata.page_key`, `services.slug`, `leads` has no unique constraints;
unique `media_files.filename`.

**Deployment status:** migrations 00001–00013 are **all applied** to the
hosted Supabase project (`quekecvmdbzpxqglztsa.supabase.co`) via
`supabase db push`. DB now contains: 5 seeded projects (status `active`),
7 services (6 seeded + "Test service", all `published`), 1 test media file,
1 site_settings row, 0 leads. The remote `projects` table was originally
created in the dashboard (status constraint `published`-based) — 00011/00013
reconcile it to the app's `active` convention.

## 5. CMS Modules

### Hero

- **Purpose:** hero section content (badge, headline, subline, CTAs, metrics,
  background image/video, social proof, SEO snippet)
- **Admin:** `/admin/content/hero` → `hero-form.tsx` (tabs: Content / Metrics /
  Design / JSON)
- **Public:** rendered by `src/components/hero.tsx` on `/`
- **Repository:** `src/lib/content/repository.ts` (`findByKey("hero")`)
  via `hero/public.ts`; defaults `hero/defaults.ts`
- **Validation:** `heroContentSchema` (hero.ts) — full content shape
- **Actions:** `saveHeroContentAction` (hero/actions.ts)
- **Media:** background image uses `MediaField` (reference or URL)
- **Status:** complete; media-aware render resolution added in 8B

### About

- **Purpose:** about page content (basic info, biography, build steps,
  timeline, principles, tools, industries, social links, resume, SEO)
- **Admin:** `/admin/content/about` → `about-form.tsx`
- **Public:** `/about` (`about-page-client.tsx` + sections)
- **Repository:** `content/repository.ts` (`findByKey("about")`) via
  `about/public.ts`; defaults `about/defaults.ts`
- **Validation:** `aboutContentSchema` (about.ts)
- **Actions:** `saveAboutContentAction` (about/actions.ts)
- **Media:** profile image uses `MediaField`
- **Status:** complete

### Projects

- **Purpose:** portfolio projects CRUD + public listing/detail
- **Admin:** `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]/edit`
  → `project-form.tsx` composed of general/media/seo/publishing/content tabs
- **Public:** `/projects`, `/projects/[slug]` (`[slug]/page.tsx`)
- **Repository:** `projects/repository.ts`; public adapter `projects/public.ts`
  (`toProject` maps DB rows → public shape; thumbnail → coverImage, images →
  gallery)
- **Validation:** `createProjectSchema`/`updateProjectSchema`/`slugSchema`
- **Actions:** CRUD + `getPublicProjectsAction`/`getPublicProjectAction` (public
  reads resolve media references at render time)
- **Media:** thumbnail/gallery (`MediaField` + `MediaPicker`), og_image
- **Status:** complete

### SEO

- **Purpose:** per-page metadata for home/about/projects/services
- **Admin:** `/admin/seo`, `/admin/seo/new`, `/admin/seo/[id]/edit` →
  `seo-list.tsx`, `seo-form.tsx`
- **Public:** `generateMetadata` via `seo/metadata.ts` `getPageMetadata(pageKey)`
- **Repository:** `seo/repository.ts` (`getSeoByPageKey`, CRUD)
- **Validation:** `createSeoSchema`/`updateSeoSchema`/`seoPageKeySchema`/
  `seoRobotsSchema`
- **Actions:** `seo/actions.ts` CRUD
- **Status:** complete; og_image supports media references (8B)

### Services

- **Purpose:** services CRUD + public listing/detail
- **Admin:** `/admin/services`, `/admin/services/new`, `/admin/services/[id]/edit`
  → `service-list.tsx`, `service-form.tsx`
- **Public:** `/services`, `/services/[slug]`
- **Repository:** `services/repository.ts`; public actions filter `published`
- **Validation:** `createServiceSchema`/`updateServiceSchema`/
  `serviceContentSchema` (JSONB content)
- **Actions:** CRUD + publish/draft/feature + public reads + slugs
- **Status:** complete (no image fields in the form — nothing to migrate)

### Leads (Lead CRM)

- **Purpose:** capture and manage sales leads from the public "Book a Free
  Audit" form (2026-07-31)
- **Public:** `/contact` → `lead-form.tsx` (client form; `submitLeadAction`,
  no auth required, RLS anon-insert)
- **Admin:** `/admin/leads` → `leads-manager.tsx` (search, status filter,
  status dropdown, delete with confirm, pagination); dashboard shows a
  "New Leads" stat card + quick action
- **Repository:** `leads/repository.ts` (`createLead` anon-safe, `getLeads`
  paginated/search/status-filtered, `updateLeadStatus`, `deleteLead`,
  `getLeadStats`)
- **Validation:** `submitLeadSchema`, `updateLeadStatusSchema` (lead.ts)
- **Actions:** `leads/actions.ts` — submit (public) + authed CRUD; client
  components import from `@/lib/leads/actions` directly (never the barrel)
- **Types:** `src/types/lead.ts` (`Lead`, `LeadStats`, `LEAD_STATUSES`)
- **Status:** complete

### Media

- **Purpose:** reusable media library (see §6)
- **Admin:** `/admin/media` → `media-manager.tsx` (grid/list, search, sort,
  pagination, upload, copy URL, edit alt/caption, delete) +
  `media-edit-dialog.tsx`
- **Public:** no dedicated page; consumed via `MediaImage`/references
- **Repository:** `media/repository.ts`
- **Validation:** `createMediaRecordSchema`, `updateMediaMetadataSchema`,
  `mediaReferenceSchema`, `mediaUrlOrReferenceSchema`
- **Actions:** `storeMediaAction`, `updateMediaMetadataAction`,
  `deleteMediaAction`, `getMediaPageAction`, `searchMediaAction`,
  `resolveMediaUrlAction`
- **Status:** complete

## 6. Media System

- **Upload flow:** `MediaUploader` → `validateMediaFile` (mime + 10 MB) →
  `uploadMediaFile` (`src/lib/media/upload.ts`) uploads via XHR to the Storage
  REST endpoint (`/storage/v1/object/media/{path}`) with the session token for
  real progress → dimensions extracted client-side → `storeMediaAction` inserts
  the `media_files` row (orphan object removed best-effort on failure)
- **Reference format:** `media:<uuid>` — stored in CMS string fields
  (`hero.background.image`, `about.basic.profileImage`, project
  thumbnail/images/og_image, `seo_metadata.og_image`)
- **Legacy URL compatibility:** legacy URLs are still accepted everywhere
  (`mediaUrlOrReferenceSchema` = URL **or** reference) and pass through
  resolvers unchanged — no forced migration, no data loss
- **Resolution:** `resolveMediaValue`/`resolveMediaValues` (server) +
  `resolveMediaUrlAction` (client action) look up `media_files.public_url`;
  missing references resolve to `null` → placeholder rendering
- **Picker:** `MediaPicker` (dialog, search, debounced, keyboard
  accessible, `aria-modal`) returns a `MediaFile`; `MediaField` wraps
  picker + uploader + paste-URL + remove + preview for forms
- **Uploader:** `MediaUploader` — drag/drop, multi-file, per-file progress,
  validation errors, keyboard-accessible dropzone
- **Storage:** public `media` bucket, flat `{uuid}.{ext}` filenames
  (immutable → cache-friendly), public read + authed write policies
- **Repository:** `media/repository.ts` — `getMedia` (paged), `getMediaById`,
  `searchMedia`, `uploadMedia` (metadata), `updateMediaMetadata`, `deleteMedia`
  (storage + row), `resolveMediaValue(s)`
- **Future expansion:** `getMediaKind` (utils) already classifies
  image/video/audio/document/other; `public_url` nullable + `storage_path`
  support private buckets via signed URLs without API changes; extensions for
  video/audio only need constant + policy updates

## 7. SEO System

- **Dynamic metadata:** every public page exports `generateMetadata`; the
  root layout provides global defaults/templates, `metadataBase` = `https://azhar.dev`
- **`getPageMetadata(pageKey)`** (`seo/metadata.ts`): reads `seo_metadata`
  row via repository, falls back to `seo/defaults.ts` `DEFAULT_SEO`, then
  `SITE_NAME`; builds title/description/keywords/robots/canonical/openGraph;
  `og_image` resolved through the media resolver (references → URL)
- **Fallback strategy:** DB → defaults → site name (three tiers); any lookup
  failure falls back instead of crashing; public pages also render mock data
  when Supabase is unreachable
- **Project SEO precedence:** project detail pages use project-level
  `seo_title`/`seo_description`/`og_image`/`canonical_url` (project form SEO
  tab) — falls back to page defaults when empty
- **Robots:** `robots.ts` (static file, sitemap-linked), `seoRobotsSchema`
  enum `index,follow | index,nofollow | noindex,follow | noindex,nofollow`
- **Sitemap:** `sitemap.ts` (dynamic — reads public data)

## 8. Shared Components

### Media library (`src/components/media/`)

- `MediaField` — form input: choose existing / upload new / paste URL /
  remove, live preview, missing-reference state (used by hero, about,
  projects, SEO forms)
- `MediaPicker` — modal grid picker with search; returns `MediaFile`
- `MediaUploader` — drag-drop multi-upload with progress
- `MediaImage` — next/image renderer; `fill` mode, sizes, placeholders for
  empty/non-image values, alt fallback chain
- `MediaThumbnail` — fixed 40px thumbnail (fill mode)
- `MediaCard` — grid card: selectable (`role=button`, `aria-pressed`),
  metadata, hover actions (visible on focus-within)

### Admin CMS (`src/components/admin/`)

- `content/hero-form.tsx`, `content/about-form.tsx` — tabbed editors with JSON
  tab + save/cancel bar, unsaved-changes indicator
- `projects/project-form.tsx` + `project-general.tsx` (slug, category,
  tags), `project-media.tsx` (thumbnail/gallery/video), `project-publishing.tsx`
  (status, featured, order, dates), `project-seo.tsx`, `project-content.tsx`,
  `project-list.tsx`, `project-card.tsx`, `project-empty-state.tsx`,
  `project-actions.tsx`, `project-form-actions.tsx`, `confirm-dialog.tsx`
- `seo/seo-form.tsx`, `seo-list.tsx`
- `services/service-form.tsx`, `service-list.tsx`
- `media/media-manager.tsx`, `media-edit-dialog.tsx`
- `shell.tsx`, `sidebar.tsx`, `header.tsx`, `mobile-menu.tsx` — admin layout

### Public (`src/components/`)

- Landing sections: `hero`, `showcase`, `features`, `case-studies`,
  `about`, `contact`, `cta`, `faq`, `timeline`, `project-modal`,
  `section-header` — driven by `src/content/*` static data
- `navbar`, `mobile-nav`, `footer`, `theme-toggle`, `social-links`,
  `page-transition`
- AI chat: `src/components/ai/*` (`chat-window`, `chat-message`,
  `floating-button`, `starter-questions`, `suggestion-buttons`,
  `typing-indicator`, `chat-provider`) + public `ChatProvider`

### UI primitives (`src/components/ui/`)

shadcn-style: `button`, `input`, `label`, `card`, `tabs`, `switch`, `badge`,
`accordion`, `avatar`, `separator`, `textarea` (Radix-backed where applicable)

### Dialog patterns

Custom framer-motion dialogs (`media-picker`, `media-edit-dialog`,
`confirm-dialog`): keyed remount (`key={media.id}`) + async-IIFE + `active`
flag effects (lint rule `react-hooks/set-state-in-effect`), Escape-to-close,
focus moves into dialog on open and returns to trigger on close,
`role="dialog" aria-modal`.

## 9. Folder Structure

```
src/
  app/                Next.js App Router (public group, admin, api)
  components/
    ui/               design-system primitives
    media/            reusable media library components
    admin/            CMS-only composites (content/projects/seo/services/media)
    ai/               AI chat UI
    sections/         public section helpers
    *.tsx             public landing components
  lib/
    <module>/         per-module: repository.ts, actions.ts, public.ts,
                      defaults.ts, index.ts (barrel), mock-data.ts
    validation/       Zod schemas + barrel
    supabase/         client, server, admin, middleware, types
    ai/               chat providers (groq/openrouter), router, models,
                      knowledge, analytics
    result.ts, logger.ts, env.ts, slug.ts, utils.ts, motion.ts,
    projects-data.ts
  types/              domain types
  constants/          module constants (media limits, seo robots, etc.)
  config/             (empty — reserved)
  content/            static public content (about, faq, projects, services…)
  providers/          theme-provider, chat-provider
  hooks/              use-intersection, use-media-query, use-mounted
supabase/migrations/  00001–00006
public/               static assets, sw.js, manifest.webmanifest
docs/                 project-handoff-v2.md, media-architecture.md,
                      phase-8b-cleanup-report.md
```

## 10. Current Public Pages

| Route                         | Notes                                                          |
| ----------------------------- | -------------------------------------------------------------- |
| `/`                           | Hero, Showcase, Features, Case Studies, About, Contact, CTA    |
| `/about`                      | About page (client sections)                                   |
| `/projects`                   | Project listing                                                |
| `/projects/[slug]`            | Project detail (dynamic)                                       |
| `/services`                   | Services listing                                               |
| `/services/[slug]`            | Service detail (dynamic)                                       |
| `/contact`                    | Contact page + "Book a Free Audit" lead form (`lead-form.tsx`) |
| `/blog`                       | Blog listing (category chips, featured, grid)                  |
| `/blog/[slug]`                | Blog post detail (metadata, reading time, CTA)                 |
| `/hub`                        | Automation Hub (resources, categories, collections)            |
| `/hub/[slug]`                 | Resource detail + files/downloads (premium gating)             |
| `/playground`                 | Workflow template library (search/filters)                     |
| `/playground/builder`         | Visual workflow builder (`@xyflow/react`)                      |
| `/playground/template/[slug]` | Template detail + "Use this template"                          |
| `/playground/share/[code]`    | Read-only shared workflow + remix link                         |
| `/offline`                    | Service-worker offline fallback page                           |
| `/robots.txt`                 | Robots file                                                    |
| `/sitemap.xml`                | Sitemap (dynamic)                                              |
| `/api/chat`                   | AI chat route handler                                          |
| `/_not-found`                 | App 404                                                        |

## 11. Current Admin Pages

| Route                          | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `/admin`                       | Dashboard shell home (lead stats + activity feed)     |
| `/admin/login`                 | Email/password sign-in                                |
| `/admin/leads`                 | Lead CRM (list/search/status/delete)                  |
| `/admin/content/hero`          | Hero content editor                                   |
| `/admin/content/about`         | About content editor                                  |
| `/admin/projects`              | Project list                                          |
| `/admin/projects/new`          | Create project                                        |
| `/admin/projects/[id]/edit`    | Edit project                                          |
| `/admin/seo`                   | SEO list                                              |
| `/admin/seo/new`               | Create SEO entry                                      |
| `/admin/seo/[id]/edit`         | Edit SEO entry                                        |
| `/admin/services`              | Service list                                          |
| `/admin/services/new`          | Create service                                        |
| `/admin/services/[id]/edit`    | Edit service                                          |
| `/admin/services`              | Service list                                          |
| `/admin/media`                 | Media manager                                         |
| `/admin/ai`                    | AI assistant UI                                       |
| `/admin/settings`              | Settings (show_blog/show_hub/show_playground toggles) |
| `/admin/blog`                  | Blog list (search/status/featured)                    |
| `/admin/blog/new`              | Create post                                           |
| `/admin/blog/[id]/edit`        | Edit post                                             |
| `/admin/hub`                   | Resource list (search/filters)                        |
| `/admin/hub/new`               | Create resource (files, changelog, pricing, SEO)      |
| `/admin/hub/[id]/edit`         | Edit resource                                         |
| `/admin/hub/categories`        | Resource category manager                             |
| `/admin/hub/collections`       | Collection manager (resource picker)                  |
| `/admin/playground`            | Workflow template list                                |
| `/admin/playground/new`        | Create template (embedded builder + walkthrough)      |
| `/admin/playground/[id]/edit`  | Edit template                                         |
| `/admin/playground/node-types` | Node library manager (key/icon/schema/JSON)           |
| `/admin/playground/categories` | Workflow category manager                             |
| `/admin/playground/shared`     | Visitor-shared workflows (view/delete)                |

## 12. Coding Standards

- **Naming:** kebab-case files, PascalCase components, camelCase functions;
  module folders plural (`projects`, `services`, `media`)
- **Validation:** every action input passes Zod `safeParse`; schemas live in
  `src/lib/validation/schemas/`; reuse `mediaUrlOrReferenceSchema` for image
  fields; never hand-validate
- **Repositories:** server-only, module-scoped, return `Result<T>`, no direct
  table access from actions/pages (read helpers for public pages may use
  repository or dedicated `public.ts`)
- **Actions:** `"use server"`, auth check first, validate, repository call,
  `revalidatePath`, return `Result<T>`, `logError` on failures
- **Types:** domain types in `src/types/`; DB rows in `src/database.types.ts`;
  `z.infer` for input types; no `any` (strict mode)
- **UI consistency:** reuse `src/components/ui/*`; `cn()` for class merging;
  dark theme only; admin pages use Card + header actions patterns
- **Error handling:** `Result<T>` everywhere; public pages render fallbacks
  (mock data/defaults) instead of crashing; dialogs show inline errors
- **Client/server boundaries:** never import server barrels into client
  components; import actions directly from `actions.ts`

## 13. Architecture Decisions (ADR)

| Decision                                           | Why                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Repository Pattern                                 | Single place per table for queries; actions/pages stay thin; RLS-safe server-only execution; testable                          |
| `Result<T>`                                        | Explicit, typed error handling without exceptions crossing module boundaries; consistent `fail(msg)` messages surface in forms |
| Shared Media Library                               | One upload/picker/render pipeline reused by every CMS module; prevents duplicate upload logic and divergent UX                 |
| Shared validation (Zod)                            | Single source of truth for input shapes shared by actions and forms; `z.infer` types stay in sync                              |
| Route groups (`(public)`)                          | Isolates public layout (navbar/footer/chat) from admin; keeps URLs clean; root layout stays global                             |
| SEO abstraction (`getPageMetadata`)                | One function produces metadata for all pages with a 3-tier fallback; new modules (e.g., Blog) plug in with a page key          |
| `media:<uuid>` references + render-time resolution | Backward compatible with legacy URLs, no data migration, missing media degrades gracefully, storage layout swappable           |
| Server-action auth checks                          | Defense in depth: proxy redirect is UX, action `getUser()` is the enforcement, RLS is the last line                            |
| XHR upload with progress                           | storage-js had no upload progress API; direct REST POST keeps progress + streaming                                             |

## 14. Known Bugs

| Issue                                                                                       | Status                    | Priority        | Recommended fix                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel production returns platform `404: NOT_FOUND` (local + build fine)                    | **Resolved** (2026-07-31) | High            | Root cause: production `main` predated the `(public)` route-group code. Fix applied: merged full feature branch into `main` (e04f8a2), Vercel auto-deployed, all routes verified 200 (`/`, `/about`, `/services`, `/projects`, `/contact`, `/admin/*`, `/robots.txt`, `/sitemap.xml`) |
| Stale service worker serving old pages (`sw.js` cache `azhar-v1`)                           | Open                      | Medium          | Bump `CACHE` version per deploy; unregister SW + clear site data after redeploy; consider precaching only `/offline`                                                                                                                                                                  |
| `sw.js` `cache.addAll` install rejection if any precache URL 404s                           | Open                      | Low             | Make install tolerant (`Promise.allSettled`-style) or precache only static assets                                                                                                                                                                                                     |
| Real-looking secrets committed in `.env.example` (anon, publishable, service-role, AI keys) | Open                      | High (security) | Replace with placeholders; rotate the leaked keys in Supabase/console                                                                                                                                                                                                                 |
| Placeholder analytics IDs (`G-XXXXXXXXXX`, `GTM-XXXXXXX`, `CLARITY_ID`) in root layout      | Open                      | Low             | Replace with real IDs when analytics are configured                                                                                                                                                                                                                                   |

## 15. Technical Debt

### Intentional

- `resolveMediaValues` resolves one query per reference (small N) — a batched
  `IN` query previously collapsed postgrest-js's generic type budget to `never`;
  batch can return when supabase-js types improve
- Images-only uploads (no video/audio) — extensions are constant/policy changes
- Legacy URL values are readable forever (by design, backward compatibility)
- `media_files.alt_text`/`caption` stored but not yet surfaced publicly
- `src/lib/content/mock-data.ts` and module mocks — keeps pages renderable
  without DB; will drift from DB content if edits happen without DB
- No foreign keys between CMS tables (decoupled by design; string references)

### Remaining lint warnings

None — `npm run lint` reports 0 errors, 0 warnings (all `<img>` warnings
resolved in Phase 8C; the only plain-image path is the uploader's transient
`blob:` preview rendered via `unoptimized` next/image, documented in
`docs/media-architecture.md`).

### Postponed features

- Real analytics IDs (GA/GTM/Clarity placeholders)
- Settings page content (shell only)
- Admin AI assistant polish
- Offline-first refinements (SW v2)

## 16. Future Roadmap

**Completed:** Engineering Foundation → Authentication → CMS Core → Project
CMS → Production Hardening → SEO CMS → Services CMS → Phase 8A (Media
Infrastructure) → Phase 8B (Media Integration) → Phase 8C (Image Optimization
& Cleanup).

**Current:** Phase 8C complete (cleanup executed, next/image everywhere,
accessibility pass, media architecture docs).

**Future:**

1. **Phase 8C follow-up** — resolve the Vercel production 404 (deployment
   config), rotate leaked secrets, fix service-worker versioning
2. **Blog CMS** — new `posts` module reusing media system, SEO page key,
   repository/action/validation patterns (integration guide in
   `docs/media-architecture.md`)
3. **Case Studies** — structured case-study content (can live in
   `content_entries` or dedicated table)
4. **Testimonials** — simple collection, likely `content_entries`-backed
5. **Leads CRM** — contact-form submissions table + admin inbox
6. **Analytics** — wire real GA/GTM/Clarity IDs, dashboard widgets
7. **Settings** — fill `/admin/settings` (site config, contact info, socials)
8. **Final Polish** — sitemap tuning, SEO audits, performance budgets,
   accessibility audits

## 17. Rules For Future Development

**Never:**

- Duplicate upload logic — always go through `src/lib/media/upload.ts` +
  `MediaUploader`/`MediaField`
- Bypass auth — every mutation action must call `auth.getUser()`; proxy is UX
  only; RLS stays the final gate
- Duplicate repositories — extend the module repository; never create second
  query layers for the same table
- Duplicate validation — reuse/combine Zod schemas in `validation/schemas/`
- Break backward compatibility — legacy URL values must keep working
- Change the `media:<uuid>` reference format — it is load-bearing across all
  modules, forms, resolvers and docs
- Import server barrels (`@/lib/<module>` or `@/lib/media`) into client
  components — import actions directly

**Always:**

- Reuse shared components (`ui/*`, `media/*`, admin composites)
- Follow `Result<T>` for all repositories and actions
- Keep TypeScript strict and the build green (0 errors, 0 lint errors)
- Hand-sync `src/database.types.ts` when migrations change
- Add `mediaUrlOrReferenceSchema` to every new image field
- Resolve media references at render time (never persist resolved URLs)
- Return mock/default fallbacks on public pages when Supabase is unavailable

## 18. Project Health

| Dimension            | Assessment                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture         | Strong — layered (pages → actions → repositories → DB), module-scoped, no cross-module coupling beyond shared media/validation                                                       |
| Scalability          | Good — media resolver does N+1 per gallery (small N); no pagination issues on public reads; DB-level filtering                                                                       |
| Security             | Good — RLS everywhere, auth on every action, security headers + CSP, no secrets in app code; **flagged:** real keys in `.env.example`, placeholders in analytics                     |
| Maintainability      | Good — consistent module pattern, typed everywhere, docs (media-architecture, handoff), dead code removed in 8C                                                                      |
| Performance          | Good — next/image + AVIF/WebP, lazy loading, fill/sizes, no layout shift, static pages where possible                                                                                |
| Developer Experience | Good — strict TS, zero lint noise, clear boundaries, fast Turbopack builds                                                                                                           |
| Production Readiness | **Ready** — production live (2026-07-31), all routes 200, latest build deployed from `main` (aa2bfe9), DB reconciled (migrations 00001–00013 applied), seeded content, lead CRM live |

---

## 19. CMS Investigation Report (2026-07-31)

Initial session: investigation-only, no code changed. Remote state verified
with read-only REST probes against the hosted project
(`quekecvmdbzpxqglztsa.supabase.co`). Follow-up fix session same day: applied
migrations 00004–00007, fixed the hero/about first-save code bug.

### Current Position

- Phase: Phase 8C complete (build/lint green locally). Investigation of live
  CMS failures completed 2026-07-31 — findings below are confirmed, not
  guessed.
- The hosted database diverges from `supabase/migrations/` and is missing
  migrations 00004–00006 entirely.

### Database Status (verified remotely)

| Object            | Status                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`        | EXISTS, empty, RLS active (anon insert → 42501). Schema DIVERGED: has `thumbnail_url` + `gallery_urls`; MISSING `thumbnail`, `images`, `client`, `demo_url`, `keywords`, `order` |
| `content_entries` | EXISTS, empty, RLS active. Columns `id, key, title, content, status` all present                                                                                                 |
| `seo_metadata`    | MISSING → PostgREST `PGRST205`                                                                                                                                                   |
| `services`        | MISSING → PostgREST `PGRST205`                                                                                                                                                   |
| `media_files`     | MISSING → PostgREST `PGRST205`                                                                                                                                                   |
| Storage buckets   | only `project-media` (public, 50 MB, image/_+video/_, created 2026-07-30). Code bucket `media` MISSING                                                                           |
| Auth              | 1 confirmed user (email verified, signs in) — auth works                                                                                                                         |

### Issues Found (confirmed)

1. **Project CMS — save/update broken.** Code writes `thumbnail`, `images`,
   `client`, `demo_url`, `keywords`, `order`; remote table lacks all six →
   PostgREST `PGRST204` (column not found) on every insert/update. Table is
   also empty, so there is nothing to edit yet.
2. **Media upload broken.** `media` bucket does not exist (only
   `project-media`) → XHR POST to `/storage/v1/object/media/{path}` fails;
   `media_files` table missing → `storeMediaAction` fails with `PGRST205`.
3. **Media selection/reference broken.** `MediaPicker`/`MediaManager`/
   `resolveMediaValue` all query `media_files` → `PGRST205` →
   `fail()` message surfaced in the picker/manager; references resolve to
   `null`.
4. **Services CMS — "Could not find the table 'public.services' in the
   schema cache".** Table `services` does not exist remotely (00005 not
   applied). Reproduced the exact error via REST.
5. **SEO CMS — same error for `seo_metadata`.** Table does not exist
   remotely (00004 not applied). Reproduced exactly.
6. **Content CMS (hero/about) — save always fails on first save (code bug).**
   `content/repository.findByKey` falls back to `MOCK_CONTENT` when the DB
   row is missing (`id: "c1"/"c2"` — not real UUIDs). `saveHeroContentAction`
   / `saveAboutContentAction` treat the mock as an existing row and call
   `update("c1"…)` → 0 rows matched → `fail("Content with id … not found")`.
   The `create` branch is unreachable while the table is empty (mock masks
   the missing row).
7. **AI admin page blank — unfinished feature, not a bug.**
   `/admin/ai/page.tsx` is a static stub (heading + one line); no
   `components/admin/ai/*` exist. Public-site AI chat is implemented
   separately (`/api/chat`, `src/components/ai/*`).
8. **Settings page empty — unfinished feature, not a bug.**
   `/admin/settings/page.tsx` is a static stub ("shell only", already
   documented as postponed).

### Root Causes (verified)

- **RC-A (database drift):** migrations 00001–00003 partially applied to the
  hosted project (with an older `projects` variant: `thumbnail_url`/
  `gallery_urls` instead of `thumbnail`/`images`); 00004–00006 never applied.
  This single cause explains issues 1–5.
- **RC-B (code bug):** mock-fallback in `content/repository.findByKey`
  short-circuits hero/about creation (issue 6). Independent of DB state —
  first save fails even on a healthy, empty DB.
- **RC-C (stub pages):** AI and Settings pages are intentionally unimplemented
  (issues 7–8). No broken code.

### Files Changed (fix session)

- `supabase/migrations/00007_reconcile_remote_projects.sql` (new) — adds the
  six missing `projects` columns to the hosted schema in place
- `src/lib/content/repository.ts` — `findByKey` no longer falls back to mock
  rows; returns `ok(null)` when the row is missing, `fail` on DB error
- `src/lib/hero/actions.ts` + `src/lib/about/actions.ts` — save flow now
  creates when the DB row is missing (never `update`s a mock id); surfaces
  DB errors instead of masking them

### Phase 8D (2026-07-31) — Admin AI + Settings implemented

- **`/admin/settings`** — full site config: identity, contact, socials, footer
  text, toggles (maintenance mode, AI chat, featured projects/services
  sections), analytics IDs (GA4/GTM/Clarity). New table `site_settings`
  (migration 00008, seed row, RLS: public read + authenticated CRUD).
  Module: `src/lib/settings/*` (schema → repository → actions), admin form
  `src/components/admin/settings/settings-form.tsx`.
- **`/admin/ai`** — content-aware CMS assistant. `/api/admin/chat` requires
  `auth.getUser()`, builds a system prompt from live CMS data (projects,
  services, SEO entries, hero/about), streams via existing `routeToAI`
  (Groq → OpenRouter). UI: `src/components/admin/ai/admin-chat.tsx`.
- **Public wiring** — root layout reads settings for GA4/GTM/Clarity
  (scripts only load when an ID is set); public layout honors maintenance
  mode (public-only screen) and `show_ai_chat`; footer is settings-driven;
  home page gates featured sections; contact page shows settings email/phone/
  location. All public reads fall back to defaults when Supabase is
  unavailable (handoff §17 rule preserved).
- **Dashboard** — real project/service counts from DB (was hardcoded).
- **`sw.js`** — cache bumped to `azhar-v2`.

### Fix Status (verified 2026-07-31)

- Migrations 00001–00003 marked applied remotely (`supabase migration repair`)
  — tables already existed from manual application
- `supabase db push` applied 00004 (seo_metadata + seeds), 00005 (services),
  00006 (media_files + `media` bucket), 00007 (projects reconcile)
- REST probes confirm: `services`/`seo_metadata`/`media_files` → 200;
  `projects` accepts `thumbnail,images,client,demo_url,keywords,order`;
  storage buckets `media` (10 MB, all mime types) + legacy `project-media`
  both exist
- `npm run lint` clean, `npm run build` green (31/31 routes)
- Remaining: manual CMS smoke test (create service, SEO entry, upload image,
  attach to hero, save hero, create project) — not yet performed

### Next Step (exact action)

1. Manual CMS smoke test in the browser: login → create service → create SEO
   entry → upload image in Media → attach to hero → save hero → create project
   with thumbnail → publish → verify public pages.
2. Rotate leaked keys in `.env.example` (open §14 issue; note: publishable/
   secret API keys exist in the dashboard — new-style `sb_publishable_*` /
   `sb_secret_*` were shared 2026-07-31; old anon/service-role keys in
   `.env.local` still work).

---

- **Last Updated:** 2026-07-31 (Lead CRM + seeds + migration reconciliation)
- **Current Build Status:** ✅ `npm run build` succeeds — 31/31 routes
- **Current Route Count:** 31 (28 app pages incl. `/admin/*` + `/_not-found` +
  `robots.txt` + `sitemap.xml` + `/api/chat` + `/api/admin/chat`)
- **TypeScript Status:** ✅ strict, 0 errors
- **Lint Status:** ✅ 0 errors, 0 warnings
- **Pending Migrations:** NONE — all 00001–00013 applied to hosted Supabase
  (2026-07-31). Remote `projects` reconciled via 00007/00011/00013
  (`thumbnail`, `images`, `client`, `demo_url`, `keywords`, `order` added;
  status constraint now accepts `active`; anon policy filters `active`).
  Seeded 5 projects + 6 services (00012). `site_settings` created via
  00008 (seed row present, verified via REST). `leads` created via 00009.
  Legacy `thumbnail_url`/`gallery_urls` columns still present but unused by
  code.
- **Open TODOs:**
  1. ~~Fix Vercel production 404~~ — RESOLVED 2026-07-31 (merged to `main`
     e04f8a2, all routes 200)
  2. Rotate leaked keys in `.env.example` — real values scrubbed 2026-07-31
     (file is gitignored; placeholders only now)
  3. Analytics IDs — GA4/GTM/Clarity now managed via `/admin/settings`;
     still need real IDs from the user
  4. Browser-test media upload on production (CSP fix live since `28aed50`)
     and verify the lead form end-to-end (public → DB → `/admin/leads`)
  5. Phase 8D: `/admin/ai` content-aware assistant + `/admin/settings`
     implemented 2026-07-31 (see §19); final polish (sitemap tuning, SEO
     audits, perf budgets) still open

---

### Post-Deploy Smoke Fixes (2026-07-31)

Fixed after first production deploy (commit `28aed50`):

1. **CSP blocked Supabase (upload broken)** - `connect-src`/`img-src` did not
   include the Supabase host, so the browser blocked the storage XHR with
   "Network error during upload". Fixed in `next.config.ts` by appending the
   Supabase origin to both directives (also fixes storage-hosted images).
2. **New services defaulted to `draft`** - created items never appeared on
   the public site (RLS shows `published` only). `service-form.tsx` now
   defaults new services to `published`; project form keeps its explicit
   Save Draft / Publish buttons.
3. **"Existing data" gone** - confirmed the DB was empty (0 projects, 0
   services, 0 media, 0 content rows); the old CMS never persisted anything
   (original bug). Public site shows mock fallbacks; admin shows real rows.
   First real row: user's `Test service` published 2026-07-31, visible on
   `/services`. Since then, mock content was seeded as real rows (00012).

### Lead CRM + Seeding Session (2026-07-31, commit `aa2bfe9`)

1. **Proxy no longer redirects action POSTs** - production server-action
   failures (RSC digest `3379654745`) traced to the middleware redirecting
   POST requests when `getUser()` transiently failed. `src/proxy.ts` now
   redirects GET/HEAD only; every action enforces auth itself.
2. **Service worker `azhar-v3`** - admin/API requests bypass the cache
   (network-only) to avoid stale admin UI; cache version bumped.
3. **Leads table + public form + admin panel** - see §5 "Leads (Lead CRM)".
4. **Seed migration 00012** - 5 projects + 6 services now real DB rows
   (edit/delete/feature from admin); public `/projects` and `/services` show
   them.
5. **Remote schema reconciliation** - the dashboard-created `projects` table
   used `'published'` status semantics; 00011 widens the constraint to accept
   `'active'` and 00013 rewrites the anonymous policy to `status = 'active'`,
   matching app queries.

### Media Module Fix (2026-07-31, commit `44c70aa`)

1. **Root cause of ALL four user-reported admin failures** (media upload RSC
   digest, project-edit "Dashboard failed to load", About editor empty,
   SEO/content editors erroring): `src/lib/media/actions.ts` ended with
   `export type { MediaSort }`. Turbopack compiled that type-only re-export
   into the server-entry export list of the media actions module
   (`ensureServerEntryExports([..., MediaSort])` + a
   `registerServerReference(MediaSort, ...)` call), producing
   `ReferenceError: MediaSort is not defined` at module evaluation. Every
   server action in the module (storeMediaAction, getMediaPageAction, ...)
   then failed with a masked RSC digest, and any client bundle importing the
   media uploader crashed on hydration.
2. **Fix**: deleted the `export type { MediaSort };` line (the type is
   re-exported from `@/types`). Verified: local `npm run build` chunk no
   longer references `MediaSort`; `storeMediaAction` replay via `Next-Action`
   POST now returns 200 and inserts the row on both local prod build and
   production (previously: 500 + digest `3973621642`).
3. **Deployment note**: GitHub webhook did not pick up the push — the fix
   deployment was triggered manually via the Vercel API
   (`POST /v13/deployments` with `gitSource {type: github, repoId: 1317280660,
ref: main}`).
4. **Lesson**: never put `export type { X }` re-exports inside modules that
   also export server actions — Next 16/Turbopack lists all exports in
   `ensureServerEntryExports`. Test media upload end-to-end after any future
   edit of `src/lib/media/actions.ts` (or any action module).

- **Last Updated:** 2026-07-31 (media module fix `44c70aa` — upload/edit/about errors resolved; pending browser retest + About prefill + SEO tag chips)

### Phase 8E — Case Studies, Testimonials, Section Toggles, Admin UX (2026-07-31, commit 8a73bfc)

1. **Migrations 00014-00016** (applied to remote, hand-synced database.types.ts):
   - case_studies table (slug unique, title, subtitle, challenge, solution,
     workflow jsonb, impact, icon, display_order, status) + RLS (anon: published
     only; authenticated: full) + seed of the 3 original case studies
     (fleet/lease/education, slugs verified, published).
   - estimonials table (name, role, company, quote, rating 1-5, avatar,
     display_order, status) + RLS same pattern; no seed.
   - site_settings gains show_hero/show_showcase/show_services/show_case_studies/
     show_about/show_testimonials/show_contact (NOT NULL DEFAULT true;
     show_testimonials DEFAULT false), backfilled from
     eatured_projects_enabled/eatured_services_enabled (legacy columns kept).
2. **New modules** src/lib/case-studies/ and src/lib/testimonials/
   (repository + server actions + Zod schemas reusing
   mediaUrlOrReferenceSchema; Result<T> everywhere; revalidate /).
   Public getter actions resolve vatar media references at render time.
3. **Public side**: homepage sections gated by the 8 toggles; case-studies
   component is DB-driven with mock fallback (no homepage regression);
   new estimonials animated carousel (6s auto-rotate, pause-on-hover,
   arrows/dots, initials fallback avatar) renders nothing when empty/off.
4. **Admin**: Case Studies + Testimonials CRUD (list with search/publish/draft/
   delete, form with auto-slug, TagInput workflow steps, rating select);
   Settings form now has the 8 per-section toggles; sidebar + mobile menu show
   an amber "Off" badge on sections disabled in Settings; new centered animated
   "Admin Panel — itsazhar" header; back arrow on every subpage; Sign out in
   sidebar/header; global toast system (src/components/ui/toast.tsx) wired
   into the new forms/lists and Settings.
5. **Leads**: rows are now compact; clicking opens a popup dialog with all
   details (email/phone/message/source/status/timestamps) plus status change
   and delete inside the dialog.
6. **Keywords inputs** (project-seo.tsx, seo-form.tsx) switched from comma
   strings to TagInput (Enter/comma add, Backspace remove, dedupe).
7. **TypeScript note**: supabase-js typed queries where data is narrowed via
   if (!data) and then iterated can infer
   ever[]; use an annotated local
   (const rows: Database[...]["Row"][] = data ?? []) — see
   src/lib/testimonials/actions.ts getPublicTestimonialsAction.
8. **Deployed**: webhook picked up 8a73bfc; deployment dpl_8wZt READY.
   Verified on prod: homepage case studies from DB, testimonials section
   hidden, admin case-studies page renders (auth cookie), settings JSON has
   new toggles.

- **Last Updated:** 2026-07-31 (Phase 8E 8a73bfc — case studies/testimonials modules, section toggles, admin shell UX, leads popup; pending user retest of project edit after hard refresh + About prefill + SEO tag chips)

### Phase 8F — Project Edit Fix, Settings Expansion, Mobile Nav, Blog CMS, AI Context (2026-07-31)

1. **Project edit crash fixed (root cause + defense)** — hosted `projects.industry`
   was legacy `text` holding PG array literal strings (`{"Logistics", ...}`);
   `project-form.tsx` `.filter()` on it crashed the admin error boundary.
   - Migration 00017 (applied): drop default → `alter column industry type text[]
using` helper → default `'{}'` → GIN index. Verified values parse + `contains`
     filter works.
   - `src/lib/projects/mappers.ts`: added `normalizeStringArray` (parses JSON
     arrays, PG literals, or single values) applied to
     industry/technologies/images/keywords/workflow — belt-and-suspenders
     against legacy shapes.
2. **Settings expansion** (migration 00018, applied):
   `site_title`, `site_description` (backfilled from site_name/site_tagline —
   legacy columns kept), `logo`, `booking_url`, `social_instagram`,
   `social_youtube`, `show_blog` (DEFAULT true). Settings form gains
   MediaField logo upload + new fields; root layout `generateMetadata()` is
   now settings-driven (site_title/site_description); navbar/footer accept
   `logoUrl`/`bookingUrl`/`showBlog`; public layout resolves the logo media
   reference at render time; footer renders Instagram/YouTube links + Blog
   link when enabled.
3. **Mobile bottom nav** (`src/components/mobile-nav.tsx`) rewritten
   Instagram-style: fixed tabs Home/Services/Projects/About/More; More opens
   a bottom sheet (Contact, Case Studies, Testimonials, Blog, AI Assistant,
   Theme toggle, Book-audit CTA) with body scroll lock, backdrop close and
   per-link close on click. Removed the pathname setState-in-effect (lint
   `react-hooks/set-state-in-effect`) — links close the sheet themselves.
4. **Blog CMS** (migration 00019, applied): `blog_posts` table (title, slug
   unique, excerpt, content markdown, cover_image, categories/tags text[],
   author, status draft/published, featured, published_at, seo fields,
   keywords) + RLS (anon: published only; authenticated: full CRUD).
   - Module: `src/constants/blog.ts`, `src/types/blog.ts`,
     `src/lib/blog/{repository,mock-data,actions,index,markdown.tsx}`,
     `src/lib/validation/schemas/blog.ts`. `published_at` auto-set on publish
     transitions, preserved on edits.
   - Admin: `/admin/blog` (list: search/status filter/featured badge),
     `/admin/blog/new`, `/admin/blog/[id]/edit` (auto-slug, markdown editor +
     live preview via custom renderer, TagInput categories/tags/keywords,
     MediaField cover/OG, featured toggle, SEO fields, publish/draft).
   - Public: `/blog` (category chips, featured card, grid) + `/blog/[slug]`
     (generateMetadata, reading time, cover, CTA block) — reads fall back to
     MOCK_BLOG_POSTS (module pattern). Sitemap includes posts.
   - Markdown renderer is custom + XSS-safe (React elements, no
     `dangerouslySetInnerHTML`); `<img>` stays plain in
     `markdown.tsx` (intentional — dynamic external URLs; one lint warning).
5. **AI assistant context + lead capture**:
   - `src/lib/ai/cms-context.ts` (new): `buildCmsKnowledge(message)` injects
     LIVE CMS data (published services, active projects, recent blog posts,
     60s module cache, graceful empty fallback) into the public chat system
     prompt alongside the static knowledge files;
     `captureChatLead(messages, intent)` captures a lead (source `chat`,
     10-min per-email dedupe) when booking/contact/pricing intent + a
     visitor email are detected — non-fatal.
   - `src/lib/ai/router.ts`: system prompt rule #8 — assistant asks for
     name/email on booking intent; website captures automatically.
   - `/api/admin/chat` context extended with blog posts (incl. drafts) +
     recent leads so the CMS assistant can summarize both.
6. **Lint/build**: `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors
   (1 intentional warning: `<img>` in markdown.tsx); `npm run build` green
   (route count now 40: +/admin/blog, /admin/blog/new, /admin/blog/[id]/edit,
   /blog, /blog/[slug], +sitemap entries).
7. **TypeScript gotchas this phase**: JSX inside a `.ts` lib file fails tsc
   with misleading "Unterminated regular expression literal" — rename to
   `.tsx`; lucide-react removed brand icons (`Instagram`/`Youtube` gone) —
   use `Camera`/`Video`.
8. **Canonical URL fix** — every hardcoded `https://azhar.dev` reference
   (layout metadataBase/OG/canonical, sitemap, robots, about layout, SEO
   defaults, form placeholders) pointed at a parked third-party domain NOT
   attached to this project (probes returned "Page Under Development").
   New `src/lib/site.ts` exports `SITE_URL`, resolved from
   `NEXT_PUBLIC_SITE_URL` (set this Vercel env var when a custom domain is
   attached) with default `https://itsazhar-portfolio.vercel.app` (the
   project's verified production domain).
9. **Public lead capture broken (RLS + `Prefer: return=representation`)** —
   `createLead` used `.insert().select().single()`; supabase-js requests
   `Prefer: return=representation`, whose representation SELECT hits the
   `leads` table with no anon SELECT policy → whole insert rejected with
   "new row violates row-level security policy". This silently broke BOTH
   the public contact form and the new chat lead capture (caught via the
   best-effort guard). FIX: `createLead` inserts without `.select()` and
   returns a synthetic `Lead` row (id `""`; status `"new"`; timestamps now).
   Verified end-to-end locally (chat → DB row with source `chat`) and the
   anon REST pattern. Lesson: never `.select()` after an anon-role insert
   on a table with write-only RLS.

### Phase 9A/9B — Automation Hub + Workflow Playground (2026-08-01)

Migrations `00020` (automation hub), `00021` (workflow playground), `00022`
(hub/playground toggles) — all applied remotely; `src/database.types.ts`
hand-synced. `@xyflow/react@12.11.2` (MIT) added for the builder.

1. **Hub data model** (migration 00020) — one polymorphic `resources` table:
   type enum (template/agent/integration/prompt/workflow/starter_kit/guide/
   course/ebook/tool/other), summary + markdown `content`, `category_id`,
   tags, cover/og images, `version`, JSONB `changelog` + `metadata`, JSONB
   `pricing` (model/price/currency/purchase_url), `access_level`
   free/premium, featured, SEO fields, keywords. Plus `resource_categories`,
   `resource_files` (label/description/`file_ref`/size/type/download_count),
   `resource_collections` + `resource_collection_items`.
   RLS: anon = SELECT published only (+ `increment_resource_download(file_id)`
   security-definer RPC returning `file_ref`); authenticated = full CRUD.
   Public downloads never `SELECT` after insert — resolved via RPC, media
   refs resolved at render time.
2. **Playground data model** (migration 00021) — `workflow_node_types`
   (key/name/category/icon/color/description + JSONB `config_schema` +
   `default_config`), `workflow_categories`, `workflow_templates` (JSONB
   `nodes`/`edges`/`canvas`/`walkthrough`, difficulty, tags, thumbnail,
   featured, views_count, SEO fields) + `increment_workflow_template_views`
   RPC, `user_workflows` (anon INSERT without select; share_code; read-only
   security-definer `get_shared_workflow(p_code)` so anon never has table
   SELECT; authenticated-only listing/deletion).
3. **Module layout** — `src/lib/hub/` with `repository.ts` (typed CRUD, all
   Result), `actions.ts` (admin + public server actions, mock fallbacks via
   `mock-data.ts` mirroring migration seeds), `index.ts` barrel;
   validation re-exported from `src/lib/validation` (`schemas/hub.ts`).
   `src/constants/hub.ts` holds type/status/label constants shared by
   validation and UI; `src/types/hub.ts` holds Public* shapes with media
   already resolved (covers/thumbnails/OG) and SEO fields.
4. **Settings toggles** (migration 00022) — `show_hub`, `show_playground`
   (DEFAULT true) added to `site_settings`; toggles in the settings form;
   navbar/footer/mobile-nav/admin-sidebar items conditionally rendered.
5. **Admin Hub** — `/admin/hub` (list: search, status/type filters,
   publish/draft, delete), `/admin/hub/new` + `/admin/hub/[id]/edit`
   (ResourceForm: details, access/pricing, files repeater with MediaField,
   changelog editor, publication + SEO), `/admin/hub/categories`,
   `/admin/hub/collections` (resource picker). No media duplication — all
   uploads go through `MediaField`/`src/lib/media/upload.ts`.
6. **Public Hub** — `/hub` (hero, category chips, collections, featured
   grid, search form, CTA) and `/hub/[slug]` (markdown body via
   `@/lib/markdown`, files sidebar + `DownloadButton` client action → RPC →
   `window.open`, changelog `<details>`, pricing panel, SEO metadata,
   booking CTA). Sitemap + AI assistant context (`cms-context.ts`) include
   hub resources.
7. **Admin Playground** — `/admin/playground` (template list),
   `/admin/playground/new` + `[id]/edit` (TemplateForm with the builder
   embedded in "form" mode: canvas + walkthrough steps + details + SEO),
   `/admin/playground/node-types` (key/name/category/icon/color + JSON
   editors for config_schema/default_config), `/admin/playground/categories`,
   `/admin/playground/shared` (view/delete visitor workflows).
8. **Public Playground** — `/playground` (featured + category/difficulty
   filters + search), `/playground/builder` (full builder; `?t=<slug>`
   loads a template, `?template=<json>` loads a remixed share payload),
   `/playground/template/[slug]` (detail + "Use this template"), and
   `/playground/share/[code]` (read-only canvas + Remix button). Builder
   features: drag/click-to-add palette from DB node types, config inspector
   driven by `config_schema`, smoothstep edges, MiniMap/Controls, export/
   import JSON, template loading, walkthrough panel, and Save & Share
   (anon insert → share link with copy button).
9. **Lint/build** — `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors
   (1 intentional warning: `<img>` in markdown.tsx); `npm run build` green
   (route count 55: +13 hub routes, +6 playground public/admin routes,
   +sitemap entries).
10. **TypeScript/lint gotchas this phase** — supabase-js 2.111 `insert()`
    rejects typed objects even for blog_posts (Schema fallback) → house
    pattern `.insert(x as never)` + row cast everywhere; zod v4
    `z.record(z.string(), z.unknown())`; lucide-react dropped brand icons
    (`Slack` gone → `MessagesSquare`); eslint react-hooks v6: no
    components created during render (hoist `ResourcePicker` out), no
    module-scope mutable counters or `Date.now()` in handlers (use a
    `useRef` counter instead).

### Phase 9C — Public ToastProvider fix, Hub marketplace, Blog polish (2026-08-01)

1. **Critical fix: public client crash** — `WorkflowBuilder` (builder +
   share pages) and `DownloadButton` (hub detail) call `useToast()`, which
   throws without a `ToastProvider`. It was only mounted in the admin
   shell, so every Playground click collapsed into the public error
   boundary ("Something went wrong"). Fix: wrap the public layout in
   `ToastProvider` (`src/app/(public)/layout.tsx`). This is why the page
   HTML 200-probes looked fine: client components are lazy-referenced in
   the RSC payload and only render/hydrate on the client.
2. **Hub marketplace** — `/hub` rewritten as a storefront: stats bar
   (total/free/paid/downloads), sticky filter bar (search, type, price
   all/free/paid, sort featured/newest/most-downloaded — all URL-driven),
   and a new `src/components/hub/resource-card.tsx` with cover + type
   badge, Premium/Featured badges, file/download counts and a price tag
   (Free = emerald pill, `$X`, `From $X/mo`). Detail page sidebar gains a
   prominent price header + Free download / Get access CTA.
3. **Blog polish** — listing: gradient hero with article/reading-time/
   topic stats, category pills, reading-time + date meta rows, author
   avatar rows, Featured badge, gradient fallback covers. Detail: author
   header block, X/LinkedIn/copy-link share buttons (`CopyLinkButton`
   client component — no inline handlers in server components), author
   card before the CTA.
4. **Gotcha** — lucide-react has also dropped `Linkedin` (brand icons) →
   use a text "in" badge like the 𝕏 one. Event handlers (`onClick`) are
   invalid in server components — the copy button must be a client
   component.

### Phase 9D — Blog sync, carousel, related posts (2026-08-01)

1. **Blog sync bug** — `blog_posts` was EMPTY in the DB while the public
   blog rendered `MOCK_BLOG_POSTS` (the action falls back to mocks on
   empty results), so nothing was manageable from `/admin/blog`. Fix:
   migration `00024_seed_blog_posts.sql` seeds the two existing mock
   posts + two new ones (idempotent `on conflict (slug) do nothing`,
   dollar-quoted `$q$` content, verbatim markdown parity with
   `src/lib/blog/mock-data.ts`). Rule: any mock post added for fallback
   parity must ALSO be seeded via migration, and vice versa.
2. **Featured carousel** — new `src/components/blog/post-carousel.tsx`
   (client, framer-motion `AnimatePresence` with direction-aware
   slide/fade, 6s autoplay paused on hover, prev/next + dot controls +
   counter, `Image` covers with dark gradient overlays, white-on-dark
   slide copy). Mounted on `/blog` with the 4 latest published posts;
   the remaining posts render as cards under "More articles".
3. **Related posts** — `rankRelated()` in `/blog/[slug]` scores every
   published post by shared categories (x2) + tags, excludes the current
   slug, returns top 3, rendered as a "Keep reading" grid before the CTA.
4. **Component extraction** — `PostCard` + shared helpers
   (`humanizeCategory`, `formatDate`, `readingTime`, `initials`,
   `CategoryPills`, `MetaRow`, `AuthorRow`) moved to
   `src/components/blog/post-card.tsx` (server-safe, also importable by
   client components); `/blog` and `/blog/[slug]` both consume it.
5. **Gotcha** — power outage corrupted the working copy of
   `/blog/[slug]/page.tsx` (file became all NUL bytes, git showed it as
   "Bin"). Restore via `git checkout -- <file>` and re-apply edits; no
   data loss.

### Phase 9E — Admin Analytics + Developer Tools + Supabase keep-alive (2026-08-01)

1. **Analytics** (`/admin/analytics`) — new `analytics_events`
   table (migration 00025) written ONLY through the security-definer
   `track_event()` RPC (granted to anon + authenticated; RLS: reads
   authenticated-only). Public tracking is fire-and-forget via
   `src/lib/analytics/actions.ts` + `src/components/analytics/trackers.tsx`
   (`PageViewTracker` with sessionStorage session ids, `CtaClickTracker`
   with click delegation on `[data-track]` elements, `HubSearchTracker`
   keyed off `?search=`). Downloads tracked in `DownloadButton`. CTAs
   instrumented: navbar, home CTA, blog list/detail, hub Get access.
   Dashboard shows: page views/sessions/downloads/CTA clicks/leads +
   conversion funnel, most-viewed projects (`projects.views` +
   `increment_project_views` RPC, called from project detail pages),
   most-viewed templates (existing `views_count`), search keywords, top
   pages, CTA breakdown, recent events. Views/tracking start at zero —
   data builds up over time.
2. **Developer Tools** (`/admin/dx`) — `getDxReportAction()` runs: env
   checker (masked keys), health monitor (DB + storage latency),
   migration status (local `supabase/migrations` vs
   `list_applied_migrations()` RPC — note `schema_migrations` has NO
   `inserted_at` column, only version/name/statements), storage status
   (bucket object counts + bytes), database row counts (16 tables),
   broken reference detector (scans `media:<uuid>` refs in
   projects/blog/resources/workflow_templates against `media_files`),
   SEO validator (blog posts + site settings), link checker (booking,
   socials, purchase URLs, demo/repo links — HEAD→GET, 8s timeout, cap
   25).
3. **Supabase keep-alive (free-plan pausing)** — Free projects pause
   after ~7 days with no API requests; a paused project is restorable
   for 90 days, then permanently deleted (free tier has ZERO backups).
   Mitigations now in place: (a) `/api/health` endpoint (light
   `blog_posts` query, no-store), (b) Vercel cron in `vercel.json`
   (daily 12:00 UTC), (c) `.github/workflows/keepalive.yml` GitHub
   Actions daily ping (note: GH disables scheduled workflows after 60
   days without repo activity — the Vercel cron covers that gap).
   Recommended extra: UptimeRobot free monitor (5-min interval) on
   `/api/health`. Any request to Supabase resets the timer.
4. **Gotchas** — supabase-js storage `list()` returns
   `FileObject[]` with `metadata.size`; `storage.listBuckets()` data is
   `Bucket[] | null`; `.maybeSingle()` returns a builder (not a bare
   Promise) — wrap in async when passing to helpers. Admin sidebar AND
   mobile menu both need new nav entries. **Projects use
   `status = 'active'`** (not 'published') — 00026 fixes
   `increment_project_views` to accept both; check status values before
   writing RPC filters.

### Phase 9F — Navigation management, Analytics/DX expansion, automated backups (2026-08-01)

1. **Blog restructure** — the hero (badge, "Building authority through
   automation", stats) is GONE. `PostCarousel` with the latest 4 posts
   (by `published_at` desc) is now the FIRST element on `/blog`;
   category pills sit below it; remaining posts render in the
   "More articles" `PostCard` grid. Nothing renders above the
   carousel.
2. **Navigation management (Settings)** — new `site_settings.nav_order`
   JSONB column (migration 00027): array of `{ label, href, enabled }`
   with default order Home, Services, Projects, About, Contact, Blog,
   Hub, Playground. Settings page gained a drag-and-drop section
   (framer-motion `Reorder.Group`, grip handle + per-item visibility
   Switch + "Reset order"). `Navbar` now renders from `nav_order`
   (AND-gated with the existing `show_blog/show_hub/show_playground`
   toggles); `MobileNav` gates its Blog/Hub/Playground "More" items the
   same way. Backward compatible: old rows fall back to defaults via
   `normalizeNavOrder()`.
3. **Analytics expansion** — `analytics_config` JSONB column
   (enabled, retentionDays, windowDays, trackSearchKeywords) editable
   from a Configuration card on `/admin/analytics`; tracking is
   disabled app-wide when `enabled=false`. Page-view metadata now
   carries `referrer` + `device` (mobile/tablet/desktop via UA).
   Dashboard additions: daily page-view bar chart (zero-filled,
   window from config), most-read blog posts (path match `/blog/*`
   joined to titles), traffic sources (referrer host → "(direct)"),
   devices, and an Export CSV button (`exportAnalyticsCsvAction`).
4. **Developer Tools expansion** — `dx_config` JSONB column
   (recordHealthChecks, linkCheckTimeoutMs, linkCheckMaxUrls,
   seoTitleMax/seoDescMin/seoDescMax) editable from a Configuration
   card on `/admin/dx`. New sections: Keep-alive history (last 30
   daily `/api/health` checks from the `health_checks` ledger),
   Backup status (latest `backups` ledger row + age + stale warning),
   RLS posture (`list_rls_status()` RPC: per-table RLS + policy
   counts; health_checks/backups are intentionally policy-free
   "locked (service role only)" tables), Orphan storage scan
   (recursive bucket listing vs `media_files.bucket/storage_path`,
   capped at 3000 files, top 30 by size). SEO/link checkers now
   honor the config targets.
5. **Automated backups + resilience (free-tier production readiness)** —
   (a) `/api/health` now upserts one `health_checks` row per day
   (service role, honoring `dx_config.recordHealthChecks`);
   (b) NEW `/api/backup` route (guarded by `x-vercel-cron: 1` or
   `BACKUP_CRON_SECRET` + `x-backup-key`), Vercel cron 00:00 UTC in
   `vercel.json`: exports 19 content tables to JSON under
   `backups/<date>/tables/` in the private `backups` storage bucket,
   writes a storage catalog (bucket/path/size/updated_at), prunes
   `analytics_events` beyond `analytics_config.retentionDays`,
   prunes backup folders older than 30 days, upserts the `backups`
   ledger (feeds the DX page); (c) NEW `.github/workflows/backup.yml`
   (03:00 UTC + manual) runs `scripts/backup-to-branch.mjs` — REST
   table exports + full storage binary downloads committed to the
   `backups` branch (offsite copy; retention 30). NOTE: GH scheduled
   workflows stop after 60 days of repo inactivity — the Vercel cron
   is the primary backup; (d) `scripts/restore-backup.mjs` restores
   from storage (`--source=storage --date=YYYY-MM-DD`) or a local
   checkout (`--source=local --path=...`), upserting tables by id +
   re-uploading storage files; `--dry-run` supported. Ledger tables
   `health_checks` + `backups` are RLS-on with NO policies (service
   role only — intentional). `list_rls_status()` RPC added.
6. **GitHub secrets REQUIRED for the offsite workflow** — add
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Actions
   repository secrets (Settings → Secrets and variables → Actions).
   Values are in `.env.local`. Until then the workflow exits 0
   silently and commits only `backups/README.md`.
7. **Gotchas (Phase 9F)** — supabase-js typed `select("jsonb_column")`
   and upserts on tables containing `unknown`-typed columns infer to
   `never` — cast the chain (`as unknown as { data: ... }`, `as never`)
   as done in `src/lib/analytics/actions.ts`, `src/lib/dx/actions.ts`,
   `src/app/api/{health,backup}/route.ts`. `bucketList` from
   `storage.listBuckets()` must be hoisted out of try-blocks to reuse
   it later in the same report. Settings form values must include
   `nav_order`/`analytics_config`/`dx_config` or
   `siteSettingsSchema.safeParse` fails (all three are required keys).
   Reorder drag-and-drop needs unique `value` per item and stable
   object identities during drags — toggle creates a new object
   (fine outside a drag).

## 20. Phase 9G - Original brand assets, secrets hygiene, safe hardening (2026-08-01, commit `abdc0a8` + `f8d544a`)

1. **All default Next.js/Vercel brand assets removed** — deleted
   `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`,
   `window.svg` and `src/app/favicon.ico` (none were referenced in
   `src/`). New 100% original branding, matching the navbar monogram
   (near-white rounded tile + dark "A" on `#09090b`):
   - `src/app/icon.svg` — original SVG favicon (served by Next at
     `/icon.svg`, auto-linked; `/favicon.ico` now 404s — expected).
   - `public/icons/icon-{192,512}.png` + `icon-{192,512}-maskable.png`
     (maskable = full-bleed dark bg, content inside safe zone) — the
     manifest already referenced exactly these paths (they had never
     existed before, so PWA icons were broken 404s until now).
   - `scripts/generate-icons.mjs` — regenerates all icons with a
     dependency-free PNG encoder (zlib + hand-rolled CRC32) and
     distance-field rasterizer. Run `node scripts/generate-icons.mjs`
     to regenerate. VERIFY pixel stats after regenerating: tile ≈60%,
     ink ≈9%, transparent ≈30%, center pixel `250,250,250,255` (a
     `0.5+(half-d)` feather must be divided by a ~1px feather width,
     otherwise the letter feathers over the whole tile).
2. **Secrets hygiene (verified)** — `git log --all -p` contains NO
   `.env*` files and no JWT/service-role strings; `.env*` is gitignored.
   Added `.env.example` (placeholders only; `.gitignore` now has
   `!.env.example`). Secret access is server-only: `src/lib/env.ts`
   reads static `process.env.X` (service-role key and AI keys are NOT
   `NEXT_PUBLIC_*` so bundlers can never inline them into client
   bundles). `/admin` is guarded by `src/proxy.ts` (redirects
   navigations, lets POST server actions through — actions enforce
   `auth.getUser()` themselves); `robots.txt` now disallows `/api/`
   AND `/admin/`; security headers (CSP, X-Frame-Options DENY,
   nosniff, Referrer-Policy, Permissions-Policy) already in
   `next.config.ts`.
3. **Domain-switch runbook (itsazhar.com)** — no code changes needed:
   the site is fully `SITE_URL`-driven (`src/lib/site.ts` resolves
   `NEXT_PUBLIC_SITE_URL` first, falling back to the Vercel domain;
   `sitemap.ts`, `robots.ts`, `metadataBase` in `src/app/layout.tsx`
   all consume it). To switch: attach `itsazhar.com` in Vercel
   (Domains → add), set the `NEXT_PUBLIC_SITE_URL` env var in Vercel
   to `https://itsazhar.com`, redeploy. Nothing else changes. Do NOT
   hardcode `itsazhar.com` anywhere until then.
4. **Safe perf/UX hardening (no breaking changes)** —
   - `getPublicSiteSettings()` wrapped in React `cache()` (one
     settings fetch per request across layout/page/footer instead of
     several).
   - `getAnalyticsConfig()` in `src/lib/analytics/actions.ts` now has
     a 60s TTL module cache (config is read on every tracked event);
     `saveAnalyticsConfigAction` calls `invalidateAnalyticsConfigCache()`
     after saving. NOTE: every export in a `"use server"` module must
     be async — `invalidateAnalyticsConfigCache()` is `async` for that
     reason (Turbopack fails the build otherwise).
   - `<link rel="apple-touch-icon" href="/icons/icon-192.png">` added
     to `src/app/layout.tsx` head.
   - `scripts/generate-icons.mjs` requires no dependencies (runs in
     plain Node, no npm packages).
5. **Deploy status** — `abdc0a8` then `f8d544a` (icon rendering fix)
   pushed; Vercel auto-deploy READY; production verified:
   `/icon.svg`, all 4 manifest icons, `/manifest.webmanifest` → 200;
   deleted assets → 404; deployed icon-512 byte-identical to local
   (8880 bytes); `robots.txt` lists both disallow rules; `/admin`
   307s to `/admin/login` with X-Frame-Options DENY present.

## 21. Phase 9H - DX + Analytics admin redesign, help system, loading states (2026-08-01, commit `946ce53`)

1. **Help system (admin panel)** — every major section, feature and
   setting on the DX + Analytics pages has a small **?** button that
   opens a dialog explaining: what it does, why it exists, when to use
   it, how it works, effects of changing it (enabled/disabled/
   modified), best practices, notes and warnings.
   - `src/lib/admin-help.ts` — the content registry (typed
     `HelpEntry`/`HelpSection` with section kinds: what/why/when/how/
     effects/best/notes/warning). 34 entries for DX + 22 for
     Analytics, including every config field.
   - `src/components/ui/help-dialog.tsx` — `HelpButton` (inline
     client ? button, works inside server components) + `HelpDialog`
     (framer-motion modal, ESC/backdrop close, icons per section
     kind, fallback entry for unknown ids).
   - `src/components/admin/section-card.tsx` — shared admin card
     (icon chip + title + optional help + optional right slot) used
     by both redesigned pages.
2. **DX page redesign** — clean stat tiles (each with help), the
   config card is a compact grid with per-field ? buttons, all 13
   sections share the SectionCard look. Stat tiles for backup size/
   tables inside Backup status; storage/migration tiles likewise.
   `src/app/admin/dx/loading.tsx` shows a skeleton immediately
   (the report does real DB + storage + outbound requests per load).
3. **Analytics page redesign** — header + page help, stat cards with
   help, chart/funnel cards in the new style, 9 leaderboard cards via
   SectionCard, recent-events card; `loading.tsx` skeleton added.
4. **Config cards** (`dx/config-card.tsx`, `analytics/config-card.tsx`)
   — per-field help buttons, **dirty state** ("Unsaved changes" amber
   dot / "All changes saved" green check), Save button disabled while
   clean or saving (spinner during save). `CsvExportButton` already
   had a spinner.
5. **AdminPageSkeleton** (`src/components/admin/page-skeleton.tsx`) —
   reusable streaming skeleton (title/description + pulse tiles +
   card blocks); used by both loading.tsx files.
6. **Verification** — tsc clean, lint at baseline (1 pre-existing
   warning), build green (61 routes); production verified with an
   authenticated session: `/admin/dx` 200 with 34 help buttons,
   `/admin/analytics` 200 with 22, config cards render "All changes
   saved". Extending help to the remaining admin sections (projects,
   blog, media, settings…) can reuse `HelpButton` + `admin-help.ts`
   entries without new infrastructure.

## 22. Phase 9I - Media folders/tags/bulk, audit log, login history, encrypted integrations, scheduled publishing, version history (2026-08-01, commits `d37cc88` → `16f943e`)

### 22.1 Media folders, tags, bulk ops, unused detection

- Migration 00028 adds `media_files.folder` (text) and `media_files.tags`
  (`text[]`, default `{}`) + GIN index.
- Repository (`src/lib/media/repository.ts`): `listMedia` gains folder/tag
  filters, `getMediaFolders`, `getMediaTags`, `bulkUpdateMedia`,
  `bulkDeleteMedia`; `collectUsedReferences` scans every site-editable
  table for the load-bearing `media:<uuid>` reference format via regex
  `media:[0-9a-f-]{36}`; `getUnusedMedia` subtracts used references from
  the media table.
- Media Manager (`src/components/admin/media/media-manager.tsx`) rewritten:
  bulk selection mode (select-all, folder/tag bulk edit, bulk delete),
  folder/tag filter bar, and an "Unused media" accordion that lists
  unused files with a one-click delete-all-unused action. Bulk mutations
  and single delete/update write audit entries (`media.updated` /
  `media.deleted`).
- `MediaUploader` accepts optional `folder`/`tags` props; MediaField passes
  through.

### 22.2 Audit log + Activity page

- `src/lib/audit.ts`: `logAudit` (best-effort, never fails the caller;
  uses service role) + `listAuditLog`/`AuditEntry` shape.
- Wired into every mutation action: SEO, settings, hero, about, content,
  blog, projects, services (create/update/delete), media (update/delete/
  bulk), versions (restore).
- `/admin/activity` page: entity filter dropdown, action-type chips, and a
  live list (latest first, paginated to 100) showing actor email, action,
  entity, summary and timestamp. Client component with server-action fetch.

### 22.3 Login history + Security page

- `src/lib/security/repository.ts` + `actions.ts`: `recordLoginAttempt`
  (best-effort) and `getLoginHistory`.
- `src/lib/auth/actions.ts` `signIn` records success/failure with IP
  (`x-forwarded-for` → `x-real-ip` fallback) and user-agent, captured via
  async `clientMeta()`.
- `/admin/security` page: stat cards (total / success / failed / last
  attempt), latest-100 table with result badge, IP, user agent, timestamp.
- Dropped active-session management: this `auth-js` version exposes no
  `listSessions`/`deleteSession` admin API — page is login history only.

### 22.4 Encrypted integration keys + Integration Center

- `src/lib/crypto.ts`: AES-256-GCM with key derived from
  `SECRET_ENCRYPTION_KEY` (SHA-256 fallback of service-role key + URL),
  `v1:` envelope (iv + tag + ciphertext, base64).
- `src/lib/integrations/repository.ts` + `actions.ts`: key save/rotate/
  remove with per-integration `expires_at`, `touchUsage`, and env fallback
  (stored key preferred, env key only when none stored). Catalog: Groq,
  OpenRouter.
- AI providers (`src/lib/ai/providers/groq.ts`, `openrouter.ts`) resolve
  keys through `resolveApiKey`, so admin-set keys are used when present.
- `/admin/integrations` page (server component) +
  `src/components/admin/integrations/integration-manager.tsx`: card per
  provider with configure/rotate/remove, expiry date input, show/hide key,
  env/stored-source badge.

### 22.5 Scheduled publishing (blog, projects, services)

- `scheduled_for` timestamptz column on all three tables; public queries
  filter `.or("scheduled_for.is.null,scheduled_for.lte.now")` (all public
  pages force-dynamic, no cron needed). Admin queries never filter.
- Forms: `scheduledFor` field with `toLocalDateTime`/`toIso` helpers,
  error-key alias `scheduled_for` → `scheduledFor`, hidden for draft-only
  publish modes. Project/service forms include the schedule input in
  FormFields/defaultFields/fieldsToJson. `getPublicSlugsAction` also
  filtered.

### 22.6 Version history (blog, projects, services)

- `src/lib/versions/repository.ts`: service-role full-row snapshots on
  every create/update (`version = MAX+1` per entity, retry once on unique
  collision 23505), list, getById, clear. Content is stored as JSONB.
- `src/lib/versions/actions.ts`: `listContentVersionsAction`,
  `restoreContentVersionAction` (ENTITY_TABLES map, SYSTEM_COLUMNS
  excluded, audit `content.restored`).
- `src/components/admin/versions/version-history.tsx`: latest-badge list,
  expandable JSON diff view, restore with confirm; mounted as a
  `VersionHistory` card in blog/projects/services edit forms. Capture is
  best-effort (never breaks the write); cleared on delete.

### 22.7 Schema, types, verification

- `supabase/migrations/00028_media_folders_tags_audit_integrations_versions_scheduling.sql`
  (applied remotely): new tables `audit_log`, `login_history`,
  `integration_settings`, `content_versions` (RLS enabled, no policies —
  service-role-only) + column additions. `src/database.types.ts`
  hand-synced.
- Sidebar/mobile-menu entries (Activity, Integrations, Security) + help
  entries in `src/lib/admin-help.ts`.
- Verified: tsc clean, lint 0 errors (1 pre-existing img warning), build
  green, deployed to Vercel. Production verification with an
  authenticated session (object-shaped `sb-*-auth-token` cookie, base64url
  with `base64-` prefix): `/admin/activity` 200 (Activity title,
  empty-state + latest-100 label), `/admin/security` 200 (Security title,
  empty-state), `/admin/integrations` 200 (Groq + OpenRouter cards,
  Not-configured status), `/admin/media` 200 (Media manager renders, no
  login redirect). Empty states are correct: no audit/logins were recorded
  yet because the tables are new and site-login recording begins from this
  release onward.

## 23. Phase 9J - Masked integration keys + data-driven catalog + monitoring dashboard (2026-08-01, commits `ded34fd` + `5a12ad6`)

### 23.1 Integration Center: masked keys, never shown in full

- `src/lib/integrations/catalog.ts` — data-driven registry: adding a new
  provider is one entry (id, label, description, keyLabel, envVarName,
  category, icon, docsUrl, keyHint). Repository, actions and UI all derive
  from it; `isIntegrationId`/`getCatalogEntry`/`getEnvKey`/`maskKey`
  helpers; unknown icon keys fall back to a generic icon so new entries
  never break the UI.
- `maskKey` keeps first 4 + last 4 characters (`gsk_••••••••••ChN5`).
  `getIntegrationList` returns `maskedKey` for the active source (stored
  secret preferred, env var fallback) — decryption happens server-side
  only. After saving/rotating, the client shows the same masking; the eye
  reveal toggle was removed and the input is always `type="password"`.
  Full values never leave the server (and never appear in HTML/RSC
  payloads — verified in production output).
- UI: masked key chip (monospace) + "Get a key" external link per card
  (from catalog `docsUrl`); repository no longer hardcodes provider
  branches — `resolveApiKey` resolves via the catalog env var name.
- Actions validate ids against the catalog instead of a hardcoded list.

### 23.2 Monitoring dashboard (`/admin`, rewritten)

- `src/lib/dashboard/actions.ts` — `getDashboardOverviewAction` returns a
  typed `DashboardOverview`, every metric computed defensively (a failing
  source degrades to a visible error/unavailable state, never fails the
  page). `src/lib/dashboard/format.ts` holds pure `formatBytes`/`formatCount`
  (a "use server" module cannot export sync functions).
- Migration `00029_db_usage_dashboard.sql` (applied remotely): new
  `get_db_usage()` RPC (security definer, service-role/authenticated only)
  returning db size bytes, approximate total rows and per-table
  size/rows (largest first).
- Widgets: system status banner (All systems operational / Attention
  needed) with health chips for Database, Storage, Uptime, Backups,
  Migrations; usage meters with progress bars for Storage (vs 1 GB Free
  tier) and Database (vs 500 MB Free tier); Request volume (tracked
  events, page views, admin actions, leads, 30d window); Bandwidth proxy
  (downloads + hosted media — exact egress needs Vercel Pro, clearly
  labeled); API usage per integration (masked key chips, call counts);
  Rate limit status (measured tracked traffic/min vs Supabase per-minute
  limits, labeled as an estimate); largest tables with size bars; service
  health detail list.
- Deployment widget reads the Vercel API best-effort (`VERCEL_TOKEN` +
  `VERCEL_PROJECT_ID`); when the token is absent in the deployed env the
  card says so instead of failing.

### 23.3 Verification

- tsc clean, lint 0 errors (1 pre-existing img warning), build green.
- Production-verified with an authenticated session: `/admin` 200 with
  all widget sections + real values (storage 526 KB used / 0.1%,
  DB size, quotas), no login redirect; `/admin/integrations` 200 with
  masked chips (`gsk_••••••••••ChN5` confirmed via UTF-8 codepoint in the
  RSC payload — full key never present in HTML).

- **Last Updated:** 2026-08-01 (Phase 9J — masked integration keys, data-driven catalog, monitoring dashboard)

### 24. Full page-copy CMS (schema-driven content editor)

Goal: all editable public page copy is managed from the admin panel - no
source edits for copy changes. Each page gets its own dedicated editor
under the existing `/admin/content` hub (sidebar item "Content"), with
separate About + Hero bespoke editors kept as-is.

- `src/lib/content/` new modules:
  - `defaults/<page>.ts` + `defaults/index.ts` - typed default copy per
    page (home, projects, services, contact, blog, hub, playground, shared)
    with a `DEFAULT_*_CONTENT` export and interfaces; shared holds brand,
    nav, mobile menu, footer, lead form and maintenance copy.
  - `merge.ts` - `deepMerge` (recursive plain-object merge; arrays and
    primitives override) + `isPlainObject`.
  - `page-defaults.ts` - `PAGE_DEFAULTS` map (8 keys) used as the
    fallback seed for admin reads.
  - `resolver.ts` - `getPublicPageContent<T>(key, defaults)` deep-merges
    stored `content_entries.content` over typed defaults (stored entries
    are partial overrides; missing rows never break rendering) and
    `getAdminPageContent(key)` returns the merged view for editors.
  - `schemas.ts` - `PAGE_CONTENT_DEFINITIONS` registry: one entry per
    key with title, description, icon, href and field groups
    (text/textarea/tags/links). Adding a future page = one definition +
    one defaults file. `getPageContentDefinition(key)`.
  - `actions.ts` - `savePageContentAction` (auth-checked, Zod-validated
    against `pageContentSchema`, upserts by key, audits
    `page-content.created/updated`, revalidates `"/", "layout"` and
    `/admin/content`) and `getPageContentAction` (admin read).
  - `mock-data.ts` - extended to 10 seeded entries (c1-c10) covering all
    8 keys with their defaults so the fallback path renders real copy.
- Admin UI: `src/app/admin/content/[page]/page.tsx` (dynamic route,
  `notFound` for unknown keys) + generic
  `src/components/admin/content/page-content-editor.tsx` (SectionCard
  groups, FieldInput per field type, dirty tracking, 4s status toast,
  `structuredClone` + `setByPath`). `/admin/content/page.tsx` hub now
  lists bespoke About/Hero cards plus all 8 definition cards.
- Public wiring - every public route now reads `getPublicPageContent`
  (typed) and renders `content.*` instead of hardcoded strings:
  - Home (`page.tsx` + showcase/features/case-studies/testimonials/
    about/contact/cta copy props).
  - Projects (`/projects` server wrapper + client `projects-page.tsx`
    for search/filter state; `/projects/[slug]`; `project-modal.tsx`
    and homepage `showcase` modal take a `detail` prop; status badge
    display maps legacy status values to content labels).
  - Services (`/services` + `[slug]`), Contact (`/contact` incl.
    benefits/detail cards), Blog (`/blog` + `[slug]` incl. author
    bio/keep-reading/CTA), Hub (`/hub` + `[slug]` incl. pricing/files/
    CTA), Playground (index, builder, `template/[slug]`, `share/[code]`).
  - Shared chrome (`src/app/(public)/layout.tsx` fetches `shared` and
    passes copy down): navbar (CTA + fallback links + brand name),
    mobile-nav (More sheet labels, AI Assistant, Theme, CTA), footer
    (intro, quick links, module labels, CTA), lead-form (labels +
    success state), maintenance screen, `social-links` now takes
    `settings` and uses settings URLs (LinkedIn/Fiverr/YouTube) with
    hardcoded fallbacks.
- SEO title/description stay in `seo_metadata` (`/admin/seo`); page
  content entries hold page copy only. Added `blog`/`hub`/`playground`
  SEO defaults (`src/lib/seo/defaults.ts`). `pageContentSchema` added
  to validation.
- Known scope: interactive builder/editor UI strings inside the
  `WorkflowBuilder` client component and analytics `data-track-label`
  values remain hardcoded (not page copy).

### 24.1 Verification

- tsc clean, lint 0 errors (1 pre-existing img warning), build green
  (31/31 routes incl. new `/admin/content/[page]`).
- Deployed (0b9e002, READY); public pages probed 200 (home, projects +
  detail, services, contact, blog, hub, playground, builder).
- Admin verified with fresh auth session: `/admin/content` hub lists
  all 10 sections; editors for shared/projects/hub/playground render
  field groups + stored values (no login redirect).
- Fix (64421f5): the home definition used bare field keys while defaults
  and wiring are nested - home editor rendered empty inputs. All home
  keys prefixed per section; every definition path is now validated
  against defaults. Editors prefill current copy, and the admin DB
  round-trip (insert/select/update/delete) was verified against RLS.

- **Last Updated:** 2026-08-01 (Phase 10 - schema-driven page-copy CMS)

## 25. Final Pre-Launch Review (2026-08-01)

- Inactivity/keep-alive audit: PASS, fully automated, no manual
  intervention required.
  - Vercel crons (primary, registered in vercel.json): /api/health
    daily 12:00 UTC (real Supabase query resets the Free-plan 7-day
    pause timer; upserts one health_checks ledger row per day),
    /api/backup daily 00:00 UTC (exports all 19 content tables to the
    private `backups` bucket + storage catalog; prunes analytics_events
    and old backup folders; ledger row in `backups`). Verified firing
    in production: bucket auto-created 2026-08-01, full run completed
    (19 tables, 59.6 KB, status ok).
  - GitHub Actions fallback (added 2026-08-01): keepalive.yml pings
    /api/health daily; nightly-backup.yml exports tables + storage to
    the `backups` branch (offsite copy). First scheduled runs 2026-08-02
    03:00/12:00 UTC. NOTE: GH disables scheduled workflows after 60 days
    without repo activity - Vercel cron is the primary mechanism.
  - Backups/health ledgers have zero RLS policies (service-role only,
    by design); DX page reads them via service-role client. Health
    checks + backups verified via service-role REST probes.
- Final review fixes (commit pending):
  - Deleted dead `src/content/` directory (8 files: about/faq/
    industries/navigation/projects/services/site/socials - zero imports
    since the CMS migration; only a stale comment in
    src/lib/ai/knowledge.ts referenced it).
  - PWA icon paths verified correct (/icons/* -> public/icons/, files
    tracked in git; manifest + apple-touch-icon confirmed 200 in prod).
  - Added OG/social share images: src/app/opengraph-image.tsx +
    twitter-image.tsx (next/og ImageResponse, zero new deps, static
    prerender, 1200x630 / 1200x675, dark brand style).
  - Removed dead Yandex config: CSP entries (mc.yandex.ru) + preconnect
    in layout - no Yandex tracker exists (GA4/GTM/Clarity only).
  - Removed debug console.log from AI providers (groq/openrouter);
    error logging retained.
- Final review status (all verified):
  - Lint 0 errors (1 pre-existing img warning), tsc clean, production
    build green (30 static + dynamic routes incl. /opengraph-image,
    /twitter-image).
  - RLS enabled on all 26 tables (0-policy tables are intentional
    service-role-only: analytics_events, audit_log, backups,
    content_versions, health_checks, integration_settings, login_history).
  - Migrations fully in sync (00001-00029 local == remote).
  - Auth: middleware redirect + getUser() on all 57 mutation actions +
    RLS. Admin chat API 401-guards. Public chat is open (knowledge
    fallback, lead capture) by design.
  - Security headers: CSP (self + GA/GTM/Groq/OpenRouter/Supabase),
    X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy,
    poweredByHeader off. .env.example placeholders only, .env.local
    untracked.
  - Media: single upload path (src/lib/media/upload.ts), session-
    authenticated, client+server validation; buckets project-media
    (public, image/video) + media (public) + backups (private).
  - SEO: sitemap covers static + projects + blog + hub + templates;
    robots disallows /api + /admin; metadata from site_settings with
    fallbacks; og/twitter images now present.
  - Responsive: mobile nav/More sheets, breakpoint grids verified
    across public + admin components.
  - Known minor items (accepted, no change): public /api/chat has no
    rate limit (lead capture is the abuse sink; keep-alive unaffected);
    admin pages rely on middleware + per-action getUser() (env is
    always set in prod, so the middleware client cannot fail there).

- **Last Updated:** 2026-08-01 (Phase 25 - final pre-launch review)

## 26. CMS Editor Prefill Fix - About / Hero / Home (2026-08-01)

- Root cause: `getAdminHeroContent()` and `getAdminAboutContent()` returned
  null when no `content_entries` row existed, so the bespoke editors
  rendered every field EMPTY while the public site rendered
  DEFAULT_HERO_CONTENT / DEFAULT_ABOUT_CONTENT. Generic page editors were
  unaffected (they merge PAGE_DEFAULTS over stored content).
- Fixes (commit 46b5999):
  - Both admin getters now fall back to the same defaults the public
    site renders - editors always prefill the current site content.
  - `saveHeroContentAction` / `saveAboutContentAction` now also call
    `revalidatePath("/", "layout")` (previously only /admin/content), so
    saves reflect site-wide immediately, consistent with
    savePageContentAction.
  - About resume was editable in the CMS but never rendered on /about -
    added a "Download Resume" button (shown only when resume.url is
    non-empty; FileText icon, external links get target=_blank).
  - `aboutResumeSchema.url` had min(1) while the default url is "" - a
    save with the default resume would have failed validation. Now
    allows empty (button renders only when a URL is set).
- Verified coverage (temp script, deleted after use): all 239 generic
  definition field keys resolve in PAGE_DEFAULTS; hero form covers all
  15 leaves of DEFAULT_HERO_CONTENT; about form covers all 20 groups of
  DEFAULT_ABOUT_CONTENT.
- Production verification (deployed READY): /admin/content/hero prefill
  "Automate anything." / "Scale everything." / "Book a Free 15-Min
  Audit" / metrics 12+,50+ / badges AI Agents,n8n / SEO title; /admin/
  content/about prefill full bio, 81 tools, industries, timeline,
  principles, social links, resume label; /admin/content/home prefill
  all groups (showcase "Featured Systems & Automation Demos", features
  "What I build.", caseStudies "From manual to automated.",
  testimonials "What clients say.", contact "Free Automation Audit",
  CTA "Ready to automate your workflow?").
- Known non-editable (technical reasons): analytics data-track labels,
  WorkflowBuilder internal UI strings, offline/404 static fallbacks
  (offline must render without the network by definition).
- hero.seo / about.seo remain editable but the site's metadata comes
  from seo_metadata (/admin/seo); harmless legacy fields.

## 27. Keep-Alive Reliability (re-verified 2026-08-01)

- Vercel crons (primary, Hobby-plan maximum = 2 daily jobs, both in
  vercel.json): /api/health 12:00 UTC + /api/backup 00:00 UTC.
  Verified live: health ledger row today (ok, 478ms, "db ok") and
  backups ledger (ok, 19 tables). The daily Supabase queries reset the
  Free-plan 7-day inactivity pause timer.
- GitHub fallback: keepalive.yml (daily /api/health ping) +
  nightly-backup.yml (offsite `backups` branch). NOTE: GH disables
  scheduled workflows after 60 days without repo activity - Vercel cron
  is the primary; this project pushes regularly.
- Backups: all 19 content tables exported nightly to the private
  `backups` bucket with a storage catalog + 30-day retention;
  health/backup ledgers drive the DX dashboard status cards.
- Public pages degrade gracefully to mock content if the DB is ever
  paused (no site outage).
- No manual intervention is required anywhere; optional extra layer the
  owner may add (requires an account, not code): UptimeRobot-style
  monitor on /api/health (endpoint is already monitor-friendly).

- **Last Updated:** 2026-08-01 (Phase 27 - reliability re-verification)
