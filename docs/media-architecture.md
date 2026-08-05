# Media Architecture

How the CMS media system works, end to end, and how future modules (e.g. Blog)
should integrate with it.

## Overview

- **Storage:** Supabase Storage, public bucket `media`, flat layout of
  `{uuid}.{ext}` filenames (50 MB upload limit — Supabase Free plan maximum;
  images, videos, audio, documents and archives).
- **Metadata:** `media_files` table (see `supabase/migrations/00006_create_media_files.sql`),
  holding filename, storage path, public URL, mime type, size, dimensions,
  alt text, caption, and timestamps.
- **Access:** public read (RLS) for files and metadata; write operations
  require an authenticated session (Storage policies + server actions).

## Media reference format

CMS fields store a reference instead of a URL:

```
media:<uuid>     // e.g. media:1f2a9c6e-7d3b-4b8a-9f0c-2e5a8b1c3d4e
```

- Legacy URL values (`https://...`) remain valid and pass through unchanged —
  no forced migration, no data loss.
- Helpers live in `src/lib/media/reference.ts`:
  `isMediaReference`, `mediaReferenceId`, `toMediaReference`.

## Upload flow (client)

1. `MediaUploader` (`src/components/media/media-uploader.tsx`) validates the
   file client-side (`validateMediaFile`), then calls
   `uploadMediaFile` (`src/lib/media/upload.ts`).
2. A unique `{uuid}.{ext}` storage path is generated; dimensions are read
   from the file.
3. The file is POSTed with an XHR directly to the Supabase Storage REST
   endpoint (`{SUPABASE_URL}/storage/v1/object/media/{path}`) with the
   session access token, giving real progress events.
4. The public URL is derived from `getPublicUrl`, and `storeMediaAction`
   (a server action) inserts the `media_files` row.
5. On failure, the orphaned storage object is removed best-effort.

## Render resolution (server)

Stored values are resolved to renderable URLs at render time:

- `resolveMediaValue` / `resolveMediaValues` (`src/lib/media/repository.ts`):
  `media:<uuid>` → lookup row → `public_url`; non-references pass through.
- Public readers resolve before serving: hero background
  (`src/lib/hero/public.ts`), about profile image (`src/lib/about/public.ts`),
  projects cover/gallery/og_image (`src/lib/projects/actions.ts`),
  SEO og_image (`src/lib/seo/metadata.ts`).
- Client components resolve on demand via `resolveMediaUrlAction`
  (`src/lib/media/actions.ts`), e.g. in `MediaField` previews.

Resolution is deliberately not persisted: legacy URLs keep working and
deleted media gracefully renders a missing-state placeholder.

## Rendering components (`src/components/media/`)

| Component        | Purpose                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `MediaImage`     | Single image renderer. next/image; `fill` mode for sized relative parents; placeholder for empty/non-image/legacy-missing values. |
| `MediaThumbnail` | Small fixed 40px thumbnail (fill mode).                                                                                           |
| `MediaCard`      | Grid card with selection (role=button, `aria-pressed`), metadata, optional hover actions.                                         |
| `MediaUploader`  | Drag & drop upload UI with progress.                                                                                              |
| `MediaPicker`    | Dialog for choosing existing media; `onSelect` receives a `MediaFile`.                                                            |
| `MediaField`     | **The form input for CMS modules** — paste URL, choose existing, upload new, remove, preview.                                     |

## Image optimization & caching

- `next/image` is used everywhere except transient client-side blob previews
  (blob URLs cannot pass through the server-side optimizer).
- `next.config.ts` allows remote images only from the Supabase project
  hostname (`NEXT_PUBLIC_SUPABASE_URL`), so storage URLs are optimizable.
- Optimized images are served from the same origin (`/_next/image`) —
  consistent with the existing CSP (`img-src 'self' ...`).
- Raw media (non-optimizable, e.g. `<video>`) is fetched directly from
  Supabase storage; the CSP carries an explicit
  `media-src 'self' <supabase-origin>` directive (added with the intro video
  fix), since without it `media` falls back to `default-src 'self'` and the
  browser silently blocks every video/audio element.
- For `<video>/<audio>` elements prefer `getVideoSourceType(url)`
  (`src/lib/media/utils.ts`) for the `<source type>` attribute instead of a
  hardcoded MIME — it derives the type from the file extension so
  WebM/MOV/MKV/OGV uploads play too.
- Filenames are immutable UUIDs, so storage URLs are cache-friendly
  (`public_url` never changes for a given row); future CDN use only needs a
  domain swap in `remotePatterns` and the `public_url` values.

## Integration guide for future modules (e.g. Blog)

1. **Validation:** use `mediaUrlOrReferenceSchema`
   (`src/lib/validation/schemas/media.ts`) for any image field — accepts both
   `media:<uuid>` and legacy URLs.
2. **Forms:** render `MediaField` (`@/components/media/media-field`) bound to
   the field; it stores the raw reference/URL on change.
3. **Public rendering:** resolve values server-side before rendering
   (e.g. `resolveMediaValues(post.images)`); pass URLs to `next/image`.
4. **Client resolution:** for client-only display, call
   `resolveMediaUrlAction` from `@/lib/media/actions` (never the server barrel).
5. **Never** import `@/lib/media/index.ts` from client components — it
   re-exports the repository (server-only, imports `next/headers`).
6. If a media reference no longer exists, `resolveMediaValue` returns `null`;
   render a placeholder rather than a broken image.

## Layout of key modules

```
src/lib/media/          server logic
  reference.ts          media:<uuid> helpers
  repository.ts         DB + storage operations (server-only)
  actions.ts            server actions ("use server")
  upload.ts             client upload API (XHR)
  utils.ts              format helpers
  index.ts              server-only barrel
src/components/media/   client components (import actions directly)
src/constants/media.ts  limits, mime types, sort options
src/types/media.ts      MediaFile types
src/lib/validation/schemas/media.ts  zod schemas
```
