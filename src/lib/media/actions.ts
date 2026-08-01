"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createMediaRecordSchema,
  updateMediaMetadataSchema,
  replaceMediaRecordSchema,
  bulkUpdateMediaSchema,
  bulkDeleteMediaSchema,
} from "@/lib/validation";
import {
  getMedia,
  searchMedia,
  uploadMedia,
  updateMediaMetadata,
  replaceMediaRecord,
  deleteMedia,
  getMediaUsage,
  replaceMediaReference,
  resolveMediaValue,
  getMediaFolders,
  getMediaTags,
  bulkUpdateMedia,
  bulkDeleteMedia,
  getUnusedMedia,
  type GetMediaQuery,
} from "./repository";
import type {
  MediaFile,
  MediaUsageItem,
  CreateMediaInput,
  UpdateMediaInput,
  ReplaceMediaInput,
  MediaPage,
  MediaKind,
  MediaFolder,
} from "@/types/media";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";

function revalidateMediaPaths(): void {
  revalidatePath("/admin/media");
}

function toNullable(value: string | null | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function storeMediaAction(input: Record<string, unknown>): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createMediaRecordSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await uploadMedia(parsed.data as CreateMediaInput, user.id);
    if (result.success) revalidateMediaPaths();
    return result;
  } catch (err) {
    logError("storeMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to record media file");
  }
}

export async function updateMediaMetadataAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateMediaMetadataSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const update: UpdateMediaInput = {};
    if ("original_name" in parsed.data) update.original_name = parsed.data.original_name;
    if ("alt_text" in parsed.data) update.alt_text = toNullable(parsed.data.alt_text);
    if ("caption" in parsed.data) update.caption = toNullable(parsed.data.caption);
    if ("folder" in parsed.data && parsed.data.folder !== undefined) {
      update.folder = parsed.data.folder.trim() === "" ? "media" : parsed.data.folder.trim();
    }
    if ("tags" in parsed.data && parsed.data.tags !== undefined) {
      update.tags = parsed.data.tags;
    }

    const result = await updateMediaMetadata(id, update);
    if (result.success) {
      revalidateMediaPaths();
      await logAudit({
        action: "media.updated",
        entity: "media",
        entityId: id,
        detail: {
          name: result.data.original_name,
          folder: update.folder,
          tags: update.tags,
        },
      });
    }
    return result;
  } catch (err) {
    logError("updateMediaMetadataAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update media metadata");
  }
}

export async function deleteMediaAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteMedia(id);
    if (result.success) {
      revalidateMediaPaths();
      await logAudit({ action: "media.deleted", entity: "media", entityId: id });
    }
    return result;
  } catch (err) {
    logError("deleteMediaAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete media file");
  }
}

export async function getMediaPageAction(query: GetMediaQuery = {}): Promise<Result<MediaPage>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getMedia(query);
  } catch (err) {
    logError("getMediaPageAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list media");
  }
}

export async function searchMediaAction(
  query: string,
  limit?: number,
  kind?: MediaKind,
): Promise<Result<MediaFile[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return searchMedia(query, limit, kind);
  } catch (err) {
    logError("searchMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to search media");
  }
}

/** Replaces the underlying file of an existing media record (id and references stay intact). */
export async function replaceMediaAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<MediaFile>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = replaceMediaRecordSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await replaceMediaRecord(id, parsed.data as ReplaceMediaInput);
    if (result.success) revalidateMediaPaths();
    return result;
  } catch (err) {
    logError("replaceMediaAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to replace media file");
  }
}

/** Finds every place a media reference is used across the CMS. */
export async function getMediaUsageAction(ref: string): Promise<Result<MediaUsageItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getMediaUsage(ref);
  } catch (err) {
    logError("getMediaUsageAction failed", {
      ref,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to find media usage");
  }
}

/** Replaces all references to a media item with another, then lets the caller delete. */
export async function replaceMediaReferenceAction(
  fromRef: string,
  toRef: string,
): Promise<Result<{ updated: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await replaceMediaReference(fromRef, toRef);
    if (result.success) revalidateMediaPaths();
    return result;
  } catch (err) {
    logError("replaceMediaReferenceAction failed", {
      fromRef,
      toRef,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to replace media references");
  }
}

/** Resolves a stored value (media reference or legacy URL) to a renderable URL. */
export async function resolveMediaUrlAction(value: string | null): Promise<string | null> {
  try {
    return await resolveMediaValue(value);
  } catch {
    return value;
  }
}

export async function getMediaFoldersAction(): Promise<Result<MediaFolder[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getMediaFolders();
  } catch (err) {
    logError("getMediaFoldersAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list media folders");
  }
}

export async function getMediaTagsAction(): Promise<Result<{ tag: string; count: number }[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getMediaTags();
  } catch (err) {
    logError("getMediaTagsAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list media tags");
  }
}

export async function bulkUpdateMediaAction(
  input: Record<string, unknown>,
): Promise<Result<{ updated: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = bulkUpdateMediaSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await bulkUpdateMedia(parsed.data.ids, {
      folder: parsed.data.folder,
      tags: parsed.data.tags,
    });
    if (result.success) {
      revalidateMediaPaths();
      await logAudit({
        action: "media.bulk_updated",
        entity: "media",
        detail: {
          count: result.data.updated,
          folder: parsed.data.folder,
          tags: parsed.data.tags,
        },
      });
    }
    return result;
  } catch (err) {
    logError("bulkUpdateMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update media in bulk");
  }
}

export async function bulkDeleteMediaAction(
  input: Record<string, unknown>,
): Promise<Result<{ deleted: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = bulkDeleteMediaSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await bulkDeleteMedia(parsed.data.ids);
    if (result.success) {
      revalidateMediaPaths();
      await logAudit({
        action: "media.bulk_deleted",
        entity: "media",
        detail: { count: result.data.deleted },
      });
    }
    return result;
  } catch (err) {
    logError("bulkDeleteMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete media in bulk");
  }
}

export async function getUnusedMediaAction(): Promise<
  Result<{ items: MediaFile[]; total: number }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getUnusedMedia();
  } catch (err) {
    logError("getUnusedMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to scan unused media");
  }
}
