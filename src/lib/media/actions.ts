"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createMediaRecordSchema, updateMediaMetadataSchema } from "@/lib/validation";
import {
  getMedia,
  searchMedia,
  uploadMedia,
  updateMediaMetadata,
  deleteMedia,
  resolveMediaValue,
  type GetMediaQuery,
} from "./repository";
import type {
  MediaFile,
  CreateMediaInput,
  UpdateMediaInput,
  MediaPage,
  MediaSort,
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
): Promise<Result<MediaFile[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return searchMedia(query, limit);
  } catch (err) {
    logError("searchMediaAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to search media");
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
