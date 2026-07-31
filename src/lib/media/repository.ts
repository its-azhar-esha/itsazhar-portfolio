import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type {
  MediaFile,
  CreateMediaInput,
  UpdateMediaInput,
  MediaPage,
  MediaSort,
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
}

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
        `original_name.ilike.${pattern},alt_text.ilike.${pattern},caption.ilike.${pattern},filename.ilike.${pattern}`,
      );
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

export async function searchMedia(query: string, limit = 24): Promise<Result<MediaFile[]>> {
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
        `original_name.ilike.${pattern},alt_text.ilike.${pattern},caption.ilike.${pattern},filename.ilike.${pattern}`,
      );
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
