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
  Media Integration (8B) → Image Optimization & Cleanup (8C)
- Build: 31/31 routes, 0 TypeScript errors, 0 lint errors (last verified Phase 8C)
- One open production issue: Vercel deployment serves the platform 404 (see §14)

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

3. **Refresh loop (auth)**
   Related to #1 — caused by the same response reassignment + `getUser`
   returning errors being treated as unauthenticated, chaining redirects.
   Fixed by the shared-response pattern; `getUser()` failures now degrade to
   "unauthenticated" without redirect loops.

## 4. Database

All migrations in `supabase/migrations/`. `src/database.types.ts` is
hand-synced with these migrations (regenerate via `supabase gen types`).

| #     | File                                | Purpose                             | Tables                                                                                                                             | RLS                                                                                                                               |
| ----- | ----------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 00001 | `00001_create_projects.sql`         | Projects table                      | `projects`                                                                                                                         | anon: select active only; authed: full CRUD. Unique slug, status/featured/order/industry/created_at indexes, `updated_at` trigger |
| 00002 | `00002_add_project_rich_fields.sql` | Rich fields for public detail pages | alters `projects` (adds rich content columns)                                                                                      | inherited from 00001                                                                                                              |
| 00003 | `00003_create_content_entries.sql`  | Reusable content store              | `content_entries` (key unique, title, JSONB content, status)                                                                       | anon: published only; authed: full CRUD. Indexes on key/status/content                                                            |
| 00004 | `00004_create_seo_metadata.sql`     | SEO CMS                             | `seo_metadata` (page_key unique, title ≤70, description ≤160, keywords[], og_image, canonical_url, robots)                         | anon: read; authed: insert/update/delete. Seeds default entries for home/about/projects/services                                  |
| 00005 | `00005_create_services.sql`         | Services CMS                        | `services` (slug unique, status, featured, display_order, JSONB content)                                                           | anon: published only; authed: full CRUD. `updated_at` trigger                                                                     |
| 00006 | `00006_create_media_files.sql`      | Media library                       | `media` bucket (public) + `media_files` (filename, storage_path, public_url nullable, mime, size, width/height, alt_text, caption) | anon: read; authed: CRUD. Storage object policies (public read, authed upload/update/delete). 10 MB image-only enforcements       |

**Constraints & relationships:** no foreign keys between CMS tables (they are
decoupled by design — media references are string-based `media:<uuid>`).
Unique constraints: `projects.slug`, `content_entries.key`,
`seo_metadata.page_key`, `services.slug`; unique `media_files.filename`.

**Deployment status:** migrations 00001–00006 exist in the repo and build
fine locally. They must be applied to the hosted Supabase project
(`quekecvmdbzpxqglztsa.supabase.co`) via `supabase db push` or the SQL editor —
application state is not verifiable from this repository.

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

| Route              | Notes                                                       |
| ------------------ | ----------------------------------------------------------- |
| `/`                | Hero, Showcase, Features, Case Studies, About, Contact, CTA |
| `/about`           | About page (client sections)                                |
| `/projects`        | Project listing                                             |
| `/projects/[slug]` | Project detail (dynamic)                                    |
| `/services`        | Services listing                                            |
| `/services/[slug]` | Service detail (dynamic)                                    |
| `/contact`         | Contact page                                                |
| `/offline`         | Service-worker offline fallback page                        |
| `/robots.txt`      | Robots file                                                 |
| `/sitemap.xml`     | Sitemap (dynamic)                                           |
| `/api/chat`        | AI chat route handler                                       |
| `/_not-found`      | App 404                                                     |

## 11. Current Admin Pages

| Route                       | Purpose                |
| --------------------------- | ---------------------- |
| `/admin`                    | Dashboard shell home   |
| `/admin/login`              | Email/password sign-in |
| `/admin/content/hero`       | Hero content editor    |
| `/admin/content/about`      | About content editor   |
| `/admin/projects`           | Project list           |
| `/admin/projects/new`       | Create project         |
| `/admin/projects/[id]/edit` | Edit project           |
| `/admin/seo`                | SEO list               |
| `/admin/seo/new`            | Create SEO entry       |
| `/admin/seo/[id]/edit`      | Edit SEO entry         |
| `/admin/services`           | Service list           |
| `/admin/services/new`       | Create service         |
| `/admin/services/[id]/edit` | Edit service           |
| `/admin/media`              | Media manager          |
| `/admin/ai`                 | AI assistant UI        |
| `/admin/settings`           | Settings (shell)       |

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

| Issue                                                                                       | Status                              | Priority        | Recommended fix                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel production returns platform `404: NOT_FOUND` (local + build fine)                    | Open (investigated, not a code bug) | High            | Deployment-side: verify production branch/alias points at the commit containing the `(public)` migration, check Framework Preset/Build Command/Output Directory in Vercel settings, configure env vars, redeploy, purge edge cache; test with `curl -I` and incognito |
| Stale service worker serving old pages (`sw.js` cache `azhar-v1`)                           | Open                                | Medium          | Bump `CACHE` version per deploy; unregister SW + clear site data after redeploy; consider precaching only `/offline`                                                                                                                                                  |
| `sw.js` `cache.addAll` install rejection if any precache URL 404s                           | Open                                | Low             | Make install tolerant (`Promise.allSettled`-style) or precache only static assets                                                                                                                                                                                     |
| Real-looking secrets committed in `.env.example` (anon, publishable, service-role, AI keys) | Open                                | High (security) | Replace with placeholders; rotate the leaked keys in Supabase/console                                                                                                                                                                                                 |
| Placeholder analytics IDs (`G-XXXXXXXXXX`, `GTM-XXXXXXX`, `CLARITY_ID`) in root layout      | Open                                | Low             | Replace with real IDs when analytics are configured                                                                                                                                                                                                                   |

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

| Dimension            | Assessment                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture         | Strong — layered (pages → actions → repositories → DB), module-scoped, no cross-module coupling beyond shared media/validation                                   |
| Scalability          | Good — media resolver does N+1 per gallery (small N); no pagination issues on public reads; DB-level filtering                                                   |
| Security             | Good — RLS everywhere, auth on every action, security headers + CSP, no secrets in app code; **flagged:** real keys in `.env.example`, placeholders in analytics |
| Maintainability      | Good — consistent module pattern, typed everywhere, docs (media-architecture, handoff), dead code removed in 8C                                                  |
| Performance          | Good — next/image + AVIF/WebP, lazy loading, fill/sizes, no layout shift, static pages where possible                                                            |
| Developer Experience | Good — strict TS, zero lint noise, clear boundaries, fast Turbopack builds                                                                                       |
| Production Readiness | **Blocked** by the open Vercel 404 issue (deployment config, not code); code-side is ready — build green, 31/31 routes                                           |

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

- **Last Updated:** 2026-07-31 (Phase 8C complete)
- **Current Build Status:** ✅ `npm run build` succeeds — 31/31 routes
- **Current Route Count:** 31 (27 app pages incl. `/admin/*` + `/_not-found` +
  `robots.txt` + `sitemap.xml` + `/api/chat`)
- **TypeScript Status:** ✅ strict, 0 errors
- **Lint Status:** ✅ 0 errors, 0 warnings
- **Pending Migrations:** NONE — all 00001–00008 applied to hosted Supabase
  (2026-07-31). Remote `projects` reconciled via 00007 (`thumbnail`, `images`,
  `client`, `demo_url`, `keywords`, `order` added). `site_settings` created via
  00008 (seed row present, verified via REST). Legacy `thumbnail_url`/
  `gallery_urls` columns still present but unused by code.
- **Open TODOs:**
  1. Fix Vercel production 404 (deployment config, see §14) — Vercel token
     requested, not yet received
  2. Rotate leaked keys in `.env.example` — real values scrubbed 2026-07-31
     (file is gitignored; placeholders only now)
  3. Analytics IDs — GA4/GTM/Clarity now managed via `/admin/settings`;
     still need real IDs from the user
  4. Manual CMS smoke test (migrations applied + hero/about save fixed
     2026-07-31, see §19)
  5. Phase 8D: `/admin/ai` content-aware assistant + `/admin/settings`
     implemented 2026-07-31 (see §19); final polish (sitemap tuning, SEO
     audits, perf budgets) still open
