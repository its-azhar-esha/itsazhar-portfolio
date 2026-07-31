"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createMediaRecordSchema,
  updateMediaMetadataSchema,
  replaceMediaRecordSchema,
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
  type GetMediaQuery,
} from "./repository";
import type {
  MediaFile,
  MediaUsageItem,
  CreateMediaInput,
  UpdateMediaInput,
  ReplaceMediaInput,
  MediaPage,
  MediaSort,
  MediaKind,
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

    const result = await updateMediaMetadata(id, update);
    if (result.success) revalidateMediaPaths();
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
    if (result.success) revalidateMediaPaths();
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

export type { MediaSort };
