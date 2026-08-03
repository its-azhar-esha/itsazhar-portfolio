import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type {
  MediaFile,
  CreateMediaInput,
  UpdateMediaInput,
  ReplaceMediaInput,
  MediaPage,
  MediaSort,
  MediaKind,
  MediaUsageItem,
  MediaFolder,
} from "@/types/media";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { MEDIA_DEFAULT_PAGE_SIZE } from "@/constants/media";
import { isMediaReference, mediaReferenceId } from "./reference";
import { warn as logWarn } from "@/lib/logger";

const TABLE = "media_files" as const;

function rowToMediaFile(row: Database["public"]["Tables"]["media_files"]["Row"]): MediaFile {
  return {
    id: row.id,
    filename: row.filename,
    original_name: row.original_name,
    bucket: row.bucket,
    storage_path: row.storage_path,
    public_url: row.public_url,
    mime_type: row.mime_type,
    extension: row.extension,
    size_bytes: row.size_bytes,
    width: row.width,
    height: row.height,
    alt_text: row.alt_text,
    caption: row.caption,
    folder: row.folder,
    tags: row.tags ?? [],
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function orderForSort(sort: MediaSort) {
  switch (sort) {
    case "oldest":
      return { column: "created_at", ascending: true } as const;
    case "name_asc":
      return { column: "original_name", ascending: true } as const;
    case "name_desc":
      return { column: "original_name", ascending: false } as const;
    case "size_asc":
      return { column: "size_bytes", ascending: true } as const;
    case "size_desc":
      return { column: "size_bytes", ascending: false } as const;
    default:
      return { column: "created_at", ascending: false } as const;
  }
}

export interface GetMediaQuery {
  search?: string;
  sort?: MediaSort;
  page?: number;
  pageSize?: number;
  kind?: MediaKind;
  folder?: string;
  tag?: string;
}

/** Builds a PostgREST filter for a media kind. */
function kindFilter(kind: MediaKind): { column: "mime_type"; value: string } | null {
  switch (kind) {
    case "image":
      return { column: "mime_type", value: "image/%" };
    case "video":
      return { column: "mime_type", value: "video/%" };
    case "audio":
      return { column: "mime_type", value: "audio/%" };
    case "document":
      return null; // handled below with an or() across document mimes
    default:
      return null;
  }
}

const DOCUMENT_MIME_FILTER =
  "mime_type.ilike.application/pdf,mime_type.ilike.%document%,mime_type.ilike.text/%";

export async function getMedia(query: GetMediaQuery = {}): Promise<Result<MediaPage>> {
  try {
    const supabase = await createClient();
    const search = query.search?.trim();
    const sort = query.sort ?? "newest";
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? MEDIA_DEFAULT_PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let builder = supabase.from(TABLE).select("*", { count: "exact" });
    if (search) {
      const pattern = `%${search}%`;
      builder = builder.or(
        `original_name.ilike.${pattern},alt_text.ilike.${pattern},caption.ilike.${pattern},filename.ilike.${pattern},mime_type.ilike.${pattern}`,
      );
    }
    if (query.kind === "document") {
      builder = builder.or(DOCUMENT_MIME_FILTER);
    } else {
      const kind = query.kind ? kindFilter(query.kind) : null;
      if (kind) builder = builder.ilike(kind.column, kind.value);
    }
    if (query.folder) {
      builder = builder.eq("folder", query.folder);
    }
    if (query.tag) {
      builder = builder.contains("tags", [query.tag]);
    }
    const order = orderForSort(sort);

    const { data, error, count } = await builder
      .order(order.column, { ascending: order.ascending })
      .range(from, to);

    if (error) return fail(error.message);

    const total = count ?? 0;
    return ok({
      items: (data ?? []).map(rowToMediaFile),
      count: total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list media");
  }
}

export async function getMediaById(id: string): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Media file with id "${id}" not found`);
    return ok(rowToMediaFile(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch media file");
  }
}

export async function searchMedia(
  query: string,
  limit = 24,
  kind?: MediaKind,
): Promise<Result<MediaFile[]>> {
  try {
    const supabase = await createClient();
    const search = query.trim();
    let builder = supabase
      .from(TABLE)
      .select("*")
      .limit(Math.min(100, Math.max(1, limit)));
    if (search) {
      const pattern = `%${search}%`;
      builder = builder.or(
        `original_name.ilike.${pattern},alt_text.ilike.${pattern},caption.ilike.${pattern},filename.ilike.${pattern},mime_type.ilike.${pattern}`,
      );
    }
    if (kind === "document") {
      builder = builder.or(DOCUMENT_MIME_FILTER);
    } else if (kind) {
      const filter = kindFilter(kind);
      if (filter) builder = builder.ilike(filter.column, filter.value);
    }
    const { data, error } = await builder.order("created_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToMediaFile));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to search media");
  }
}

/** Stores metadata for a file already uploaded to storage. */
export async function uploadMedia(
  input: CreateMediaInput,
  userId: string,
): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...input, uploaded_by: userId } as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to record media file — no data returned.");
    return ok(rowToMediaFile(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to record media file");
  }
}

export async function updateMediaMetadata(
  id: string,
  input: UpdateMediaInput,
): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Media file with id "${id}" not found.`);
    return ok(rowToMediaFile(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update media metadata");
  }
}

/** Removes the storage object, then the database record. */
export async function deleteMedia(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const existing = await getMediaById(id);
    if (!existing.success) return fail(existing.error);

    const { error: removeError } = await supabase.storage
      .from(existing.data.bucket)
      .remove([existing.data.storage_path]);
    if (removeError) {
      logWarn("deleteMedia: storage object removal failed (continuing with row delete)", {
        id,
        storagePath: existing.data.storage_path,
        message: removeError.message,
      });
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete media file");
  }
}

/** Replaces the stored file for an existing media record, keeping the same id and references. */
export async function replaceMediaRecord(
  id: string,
  input: ReplaceMediaInput,
): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Media file with id "${id}" not found.`);
    return ok(rowToMediaFile(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to replace media file");
  }
}

/** Human-readable label for a JSON path inside hero/about content entries. */
function labelForContentPath(path: string[]): string {
  const key = path.join(".");
  const known: Record<string, string> = {
    "background.image": "Background Image",
    "background.video": "Background Video",
    "basic.profileImage": "Profile Image",
    "basic.introVideoUrl": "Intro Video",
  };
  if (known[key]) return known[key];
  const last = path[path.length - 1] ?? "Field";
  return last.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

/** Recursively collects JSON paths whose string value equals the reference. */
function collectReferencePaths(
  value: unknown,
  ref: string,
  path: string[] = [],
  found: string[][] = [],
): string[][] {
  if (typeof value === "string") {
    if (value === ref) found.push(path);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectReferencePaths(item, ref, [...path, String(index)], found),
    );
    return found;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collectReferencePaths(child, ref, [...path, key], found);
    }
  }
  return found;
}

/**
 * Finds every place a media reference is used across the CMS:
 * projects fields, content_entries JSON (hero/about) and SEO metadata.
 */
export async function getMediaUsage(ref: string): Promise<Result<MediaUsageItem[]>> {
  try {
    const supabase = await createClient();
    const usage: MediaUsageItem[] = [];

    if (!isMediaReference(ref)) return ok(usage);

    // Projects
    type ProjectMediaRow = Pick<
      Database["public"]["Tables"]["projects"]["Row"],
      "id" | "title" | "thumbnail" | "images" | "og_image" | "video_url"
    >;
    const { data: projectsData, error: projectError } = await supabase
      .from("projects")
      .select("id, title, thumbnail, images, og_image, video_url")
      .limit(500);
    if (projectError) return fail(projectError.message);
    for (const project of (projectsData ?? []) as ProjectMediaRow[]) {
      const fields: string[] = [];
      if (project.thumbnail === ref) fields.push("Thumbnail");
      if (project.og_image === ref) fields.push("OpenGraph Image");
      if (project.video_url === ref) fields.push("Intro Video");
      const images = (project.images as string[] | null) ?? [];
      if (images.includes(ref)) fields.push("Gallery");
      if (fields.length > 0) {
        usage.push({ kind: "project", id: project.id, title: project.title, fields });
      }
    }

    // Content entries (hero/about and any future JSONB modules)
    type ContentRow = Pick<
      Database["public"]["Tables"]["content_entries"]["Row"],
      "id" | "key" | "title" | "content"
    >;
    const { data: entriesData, error: entryError } = await supabase
      .from("content_entries")
      .select("id, key, title, content")
      .limit(500);
    if (entryError) return fail(entryError.message);
    for (const entry of (entriesData ?? []) as ContentRow[]) {
      const paths = collectReferencePaths(entry.content, ref);
      if (paths.length === 0) continue;
      const kind =
        entry.key === "hero"
          ? ("hero" as const)
          : entry.key === "about"
            ? ("about" as const)
            : ("content" as const);
      const fields = paths.map((path) => labelForContentPath(path));
      usage.push({
        kind,
        id: entry.id,
        title: entry.title || entry.key,
        fields,
      });
    }

    // SEO metadata
    type SeoRow = Pick<
      Database["public"]["Tables"]["seo_metadata"]["Row"],
      "id" | "page_key" | "og_image"
    >;
    const { data: seoData, error: seoError } = await supabase
      .from("seo_metadata")
      .select("id, page_key, og_image")
      .limit(500);
    if (seoError) return fail(seoError.message);
    for (const row of (seoData ?? []) as SeoRow[]) {
      if (row.og_image === ref) {
        usage.push({
          kind: "seo",
          id: row.id,
          title: row.page_key,
          fields: ["OpenGraph Image"],
        });
      }
    }

    return ok(usage);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to find media usage");
  }
}

/**
 * Replaces every occurrence of `fromRef` with `toRef` across the CMS
 * (projects fields, content_entries JSON, SEO metadata). Returns the
 * number of records updated.
 */
export async function replaceMediaReference(
  fromRef: string,
  toRef: string,
): Promise<Result<{ updated: number }>> {
  try {
    if (!isMediaReference(fromRef) || !isMediaReference(toRef)) {
      return fail("Both values must be media library references.");
    }
    const supabase = await createClient();
    let updated = 0;

    // Projects — scalar fields
    type ProjectIdRow = Pick<Database["public"]["Tables"]["projects"]["Row"], "id">;
    for (const column of ["thumbnail", "og_image", "video_url"] as const) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq(column, fromRef)
        .limit(500);
      if (error) return fail(error.message);
      for (const row of (data ?? []) as ProjectIdRow[]) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ [column]: toRef } as never)
          .eq("id", row.id);
        if (updateError) return fail(updateError.message);
        updated++;
      }
    }

    // Projects — images array
    type ProjectImageRow = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "images">;
    const { data: imageRows, error: imageError } = await supabase
      .from("projects")
      .select("id, images")
      .contains("images", [fromRef])
      .limit(500);
    if (imageError) return fail(imageError.message);
    for (const row of (imageRows ?? []) as ProjectImageRow[]) {
      const images = ((row.images as string[] | null) ?? []).map((value) =>
        value === fromRef ? toRef : value,
      );
      const { error: updateError } = await supabase
        .from("projects")
        .update({ images } as never)
        .eq("id", row.id);
      if (updateError) return fail(updateError.message);
      updated++;
    }

    // SEO metadata
    type SeoIdRow = Pick<Database["public"]["Tables"]["seo_metadata"]["Row"], "id">;
    const { data: seoRows, error: seoError } = await supabase
      .from("seo_metadata")
      .select("id")
      .eq("og_image", fromRef)
      .limit(500);
    if (seoError) return fail(seoError.message);
    for (const row of (seoRows ?? []) as SeoIdRow[]) {
      const { error: updateError } = await supabase
        .from("seo_metadata")
        .update({ og_image: toRef } as never)
        .eq("id", row.id);
      if (updateError) return fail(updateError.message);
      updated++;
    }

    // Content entries — JSONB text replacement (references are exact strings)
    type EntryRow = Pick<Database["public"]["Tables"]["content_entries"]["Row"], "id" | "content">;
    const { data: entries, error: entryError } = await supabase
      .from("content_entries")
      .select("id, content")
      .limit(500);
    if (entryError) return fail(entryError.message);
    for (const entry of (entries ?? []) as EntryRow[]) {
      const raw = JSON.stringify(entry.content);
      if (!raw.includes(fromRef)) continue;
      const next = JSON.parse(raw.split(fromRef).join(toRef));
      const { error: updateError } = await supabase
        .from("content_entries")
        .update({ content: next } as never)
        .eq("id", entry.id);
      if (updateError) return fail(updateError.message);
      updated++;
    }

    return ok({ updated });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to replace media references");
  }
}

/**
 * Resolves a stored value to a renderable URL.
 * Media references (`media:<uuid>`) resolve to the file's public URL;
 * legacy URL values pass through unchanged. Returns null when a media
 * reference no longer exists.
 */
export async function resolveMediaValue(value: string | null): Promise<string | null> {
  if (!value || !isMediaReference(value)) return value;
  const id = mediaReferenceId(value);
  if (!id) return null;
  const result = await getMediaById(id);
  return result.success ? result.data.public_url : null;
}

/** Resolves a batch of values. Non-references pass through unchanged. */
export async function resolveMediaValues(values: (string | null)[]): Promise<(string | null)[]> {
  return Promise.all(values.map((value) => resolveMediaValue(value)));
}

/** Lists all folders with their file counts, sorted by name. */
export async function getMediaFolders(): Promise<Result<MediaFolder[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").limit(5000);
    if (error) return fail(error.message);

    type FolderRow = Pick<Database["public"]["Tables"]["media_files"]["Row"], "folder">;
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as FolderRow[]) {
      counts.set(row.folder, (counts.get(row.folder) ?? 0) + 1);
    }
    const folders: MediaFolder[] = Array.from(counts.entries())
      .map(([folder, count]) => ({ folder, count }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
    return ok(folders);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list media folders");
  }
}

/** Lists every tag currently used across media files, with file counts. */
export async function getMediaTags(): Promise<Result<{ tag: string; count: number }[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").limit(5000);
    if (error) return fail(error.message);

    type TagsRow = Pick<Database["public"]["Tables"]["media_files"]["Row"], "tags">;
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as TagsRow[]) {
      for (const tag of row.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const tags = Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    return ok(tags);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list media tags");
  }
}

/** Applies folder/tags to a batch of media files. Returns the updated count. */
export async function bulkUpdateMedia(
  ids: string[],
  input: { folder?: string; tags?: string[] },
): Promise<Result<{ updated: number }>> {
  try {
    const supabase = await createClient();
    const clean: { folder?: string; tags?: string[] } = {};
    if (input.folder !== undefined) {
      const folder = input.folder.trim();
      clean.folder = folder === "" ? "media" : folder;
    }
    if (input.tags !== undefined) {
      clean.tags = input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    }
    if (Object.keys(clean).length === 0 || ids.length === 0) return ok({ updated: 0 });

    let updated = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data, error } = await supabase
        .from(TABLE)
        .update(clean as never)
        .in("id", chunk)
        .select("*");
      if (error) return fail(error.message);
      updated += (data ?? []).length;
    }
    return ok({ updated });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update media in bulk");
  }
}

/** Deletes a batch of media files (storage object + database row). */
export async function bulkDeleteMedia(ids: string[]): Promise<Result<{ deleted: number }>> {
  try {
    const supabase = await createClient();
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { data: files, error: listError } = await supabase
        .from(TABLE)
        .select("*")
        .in("id", chunk);
      if (listError) return fail(listError.message);

      type PathRow = Pick<
        Database["public"]["Tables"]["media_files"]["Row"],
        "bucket" | "storage_path"
      >;
      const pathsByBucket = new Map<string, string[]>();
      for (const file of (files ?? []) as PathRow[]) {
        const paths = pathsByBucket.get(file.bucket) ?? [];
        paths.push(file.storage_path);
        pathsByBucket.set(file.bucket, paths);
      }
      for (const [bucket, paths] of pathsByBucket) {
        const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
        if (removeError) {
          logWarn("bulkDeleteMedia: storage removal failed (continuing with row delete)", {
            count: paths.length,
            message: removeError.message,
          });
        }
      }

      const { data, error } = await supabase.from(TABLE).delete().in("id", chunk).select("*");
      if (error) return fail(error.message);
      deleted += (data ?? []).length;
    }
    return ok({ deleted });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete media in bulk");
  }
}

/**
 * Collects every `media:<uuid>` reference used anywhere in the CMS.
 * Returns full references (e.g. `media:1f2a...`) so callers can compare
 * against `media_files` rows directly.
 */
async function collectUsedReferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const used = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && isMediaReference(value)) used.add(value);
  };

  type ProjectMediaRow = Pick<
    Database["public"]["Tables"]["projects"]["Row"],
    "thumbnail" | "og_image" | "video_url" | "images"
  >;
  const { data: projects } = await supabase.from("projects").select("*").limit(5000);
  for (const row of (projects ?? []) as ProjectMediaRow[]) {
    add(row.thumbnail);
    add(row.og_image);
    add(row.video_url);
    for (const image of (row.images as string[] | null) ?? []) add(image);
  }

  type ContentRow = Pick<Database["public"]["Tables"]["content_entries"]["Row"], "content">;
  const { data: entries } = await supabase.from("content_entries").select("*").limit(5000);
  for (const row of (entries ?? []) as ContentRow[]) {
    const raw = JSON.stringify(row.content ?? {});
    for (const match of raw.matchAll(/media:[0-9a-f-]{36}/g)) used.add(match[0]);
  }

  type SeoRow = Pick<Database["public"]["Tables"]["seo_metadata"]["Row"], "og_image">;
  const { data: seo } = await supabase.from("seo_metadata").select("*").limit(5000);
  for (const row of (seo ?? []) as SeoRow[]) add(row.og_image);

  type BlogRow = Pick<
    Database["public"]["Tables"]["blog_posts"]["Row"],
    "cover_image" | "og_image"
  >;
  const { data: blog } = await supabase.from("blog_posts").select("*").limit(5000);
  for (const row of (blog ?? []) as BlogRow[]) {
    add(row.cover_image);
    add(row.og_image);
  }

  type ResourceRow = Pick<
    Database["public"]["Tables"]["resources"]["Row"],
    "cover_image" | "og_image"
  >;
  const { data: resources } = await supabase.from("resources").select("*").limit(5000);
  for (const row of (resources ?? []) as ResourceRow[]) {
    add(row.cover_image);
    add(row.og_image);
  }

  type TemplateRow = Pick<Database["public"]["Tables"]["workflow_templates"]["Row"], "thumbnail">;
  const { data: templates } = await supabase.from("workflow_templates").select("*").limit(5000);
  for (const row of (templates ?? []) as TemplateRow[]) add(row.thumbnail);

  type SettingsRow = Pick<Database["public"]["Tables"]["site_settings"]["Row"], "logo">;
  const { data: settings } = await supabase.from("site_settings").select("*").limit(50);
  for (const row of (settings ?? []) as SettingsRow[]) add(row.logo);

  type TestimonialRow = Pick<Database["public"]["Tables"]["testimonials"]["Row"], "avatar">;
  const { data: testimonials } = await supabase.from("testimonials").select("*").limit(5000);
  for (const row of (testimonials ?? []) as TestimonialRow[]) add(row.avatar);

  type CollectionRow = Pick<
    Database["public"]["Tables"]["resource_collections"]["Row"],
    "cover_image"
  >;
  const { data: collections } = await supabase.from("resource_collections").select("*").limit(5000);
  for (const row of (collections ?? []) as CollectionRow[]) add(row.cover_image);

  type ResourceFileRow = Pick<Database["public"]["Tables"]["resource_files"]["Row"], "file_ref">;
  const { data: resourceFiles } = await supabase.from("resource_files").select("*").limit(5000);
  for (const row of (resourceFiles ?? []) as ResourceFileRow[]) add(row.file_ref);

  return used;
}

/**
 * Returns the set of every media reference currently used anywhere in the CMS
 * (full `media:<uuid>` strings). Server-only helper for unused-media scans.
 */
export async function getUsedMediaRefs(): Promise<Set<string>> {
  const supabase = await createClient();
  return collectUsedReferences(supabase);
}

/**
 * Finds media files that are not referenced anywhere in the CMS
 * (projects, content entries, SEO metadata, blog posts, resources,
 * workflow templates, site settings). Returns them with the total
 * file count so the UI can show "N of M files are unused".
 */
export async function getUnusedMedia(): Promise<Result<{ items: MediaFile[]; total: number }>> {
  try {
    const supabase = await createClient();
    const used = await collectUsedReferences(supabase);

    const { data, error } = await supabase.from(TABLE).select("*").limit(5000);
    if (error) return fail(error.message);

    type MediaRow = Database["public"]["Tables"]["media_files"]["Row"];
    const items = ((data ?? []) as MediaRow[])
      .filter((row) => !used.has(`media:${row.id}`))
      .map(rowToMediaFile);
    return ok({ items, total: (data ?? []).length });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to scan unused media");
  }
}
