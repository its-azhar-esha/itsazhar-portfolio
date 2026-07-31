# Phase 8B — Legacy Media Cleanup Report

> **Status: executed in Phase 8C.** All items classified "Safe to delete"
> below were removed; nothing marked "Still referenced" or "Manual migration
> required" was touched. See `docs/media-architecture.md` for the current
> architecture.

## Summary

Phase 8B migrated every CMS form and public render path to the new media system
(media library + `media:<uuid>` references). The legacy upload system is now
dead code: nothing outside `src/components/admin/media/` references it.

## Legacy system (safe to remove)

### Components — `src/components/admin/media/`

| File                  | Status         | Notes                                             |
| --------------------- | -------------- | ------------------------------------------------- |
| `media-upload.tsx`    | Safe to delete | Legacy XHR upload UI (old `project-media` bucket) |
| `upload-zone.tsx`     | Safe to delete | Internal to `media-upload.tsx`                    |
| `upload-progress.tsx` | Safe to delete | Internal to `media-upload.tsx`                    |
| `media-picker.tsx`    | Safe to delete | Dialog wrapping `MediaLibrary`                    |
| `media-library.tsx`   | Safe to delete | Legacy list + delete via `@/lib/storage`          |
| `media-grid.tsx`      | Safe to delete | Internal to `media-library.tsx`                   |
| `media-card.tsx`      | Safe to delete | Internal to `media-grid.tsx`                      |
| `index.ts`            | Safe to delete | Barrel re-exporting only legacy components        |

**Keep in this folder:** `media-manager.tsx` + `media-edit-dialog.tsx` — these are
the new-system admin pages (import the new `@/components/media/*` components and
`@/lib/media/*` actions). They are used by `/admin/media/page.tsx`.

### Library — `src/lib/storage/`

| File         | Status         | Notes                                                                                       |
| ------------ | -------------- | ------------------------------------------------------------------------------------------- |
| `actions.ts` | Safe to delete | `uploadFileAction` / `listFilesAction` / `deleteFileAction` (legacy `project-media` bucket) |
| `client.ts`  | Safe to delete | Legacy client wrapper                                                                       |
| `index.ts`   | Safe to delete | Barrel                                                                                      |

## New system (used everywhere now)

- `src/lib/media/*` — reference helpers, repository, actions, upload API
- `src/components/media/*` — MediaField, MediaPicker, MediaUploader, MediaImage, MediaThumbnail, MediaCard
- Forms: hero, about, project media/SEO, SEO CMS — all use `MediaField`
- Public rendering: hero background, about profile image, project cover/gallery/og, SEO og — resolved at render time via `resolveMediaValue(s)`

## Verification before deletion

1. Run `npm run build` (expect 31/31 routes, 0 TS errors).
2. Run `npm run lint` (expect 0 errors; the `<img>` warning in the old
   `admin/media/media-card.tsx` will disappear with it).
3. Grep for `@/lib/storage` and `@/components/admin/media/media-` outside
   `src/components/admin/media/` — expect zero matches.
4. No migration needed: legacy URL values remain valid everywhere; references
   and URLs are both accepted by forms and resolved at render time.
