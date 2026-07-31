import { env } from "@/lib/env";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { storeMediaAction, replaceMediaAction } from "./actions";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MEDIA_BUCKET,
  MIME_EXTENSIONS,
} from "@/constants/media";
import type { MediaFile } from "@/types/media";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { formatBytes } from "./utils";

export interface MediaUploadProgress {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
}

export interface UploadMediaFileOptions {
  onProgress?: (progress: MediaUploadProgress) => void;
}

/** Client-side security gate: mime type + size. */
export function validateMediaFile(file: File): string | null {
  const mime = file.type;
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(mime as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
    const label = mime || "unknown";
    return `Unsupported file type "${label}". Allowed: images (JPG, PNG, WebP, GIF, AVIF), videos (MP4, WebM, MOV) and documents (PDF, TXT).`;
  }
  if (file.size <= 0) return "File is empty.";
  if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
    return `File exceeds the ${formatBytes(MAX_MEDIA_FILE_SIZE_BYTES)} limit.`;
  }
  return null;
}

async function getImageDimensions(
  file: File,
): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith("image/")) return { width: null, height: null };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    image.src = url;
  });
}

async function uploadToStorage(
  file: File,
  storagePath: string,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<void> {
  const supabase = createBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Authentication required.");

  const url = `${env.supabaseUrl}/storage/v1/object/${MEDIA_BUCKET}/${storagePath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress({
        percent: Math.round((event.loaded / event.total) * 100),
        uploadedBytes: event.loaded,
        totalBytes: event.total,
      });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || "Unknown error"}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

/**
 * Reusable upload API: accept a browser File, validate, upload to
 * Supabase Storage, store metadata, return the MediaFile record.
 */
export async function uploadMediaFile(
  file: File,
  options: UploadMediaFileOptions = {},
): Promise<Result<MediaFile>> {
  const validationError = validateMediaFile(file);
  if (validationError) return fail(validationError);

  const extension = MIME_EXTENSIONS[file.type];
  const filename = `${crypto.randomUUID()}.${extension}`;
  const { width, height } = await getImageDimensions(file);

  try {
    await uploadToStorage(file, filename, options.onProgress);

    const supabase = createBrowserClient();
    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filename);

    const result = await storeMediaAction({
      filename,
      original_name: file.name,
      bucket: MEDIA_BUCKET,
      storage_path: filename,
      public_url: publicUrl,
      mime_type: file.type,
      extension,
      size_bytes: file.size,
      width,
      height,
      alt_text: null,
      caption: null,
    });

    if (!result.success) {
      // Best-effort cleanup of the orphaned storage object.
      supabase.storage.from(MEDIA_BUCKET).remove([filename]);
      return result;
    }
    return ok(result.data);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Upload failed.");
  }
}

/**
 * Replaces the underlying file of an existing media record. The record id
 * (and every `media:<uuid>` reference to it) stays unchanged; the old
 * storage object is removed after the new one is in place.
 */
export async function replaceMediaFile(
  file: File,
  media: MediaFile,
  options: UploadMediaFileOptions = {},
): Promise<Result<MediaFile>> {
  const validationError = validateMediaFile(file);
  if (validationError) return fail(validationError);

  const extension = MIME_EXTENSIONS[file.type];
  const filename = `${crypto.randomUUID()}.${extension}`;
  const { width, height } = await getImageDimensions(file);

  try {
    await uploadToStorage(file, filename, options.onProgress);

    const supabase = createBrowserClient();
    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filename);

    const result = await replaceMediaAction(media.id, {
      filename,
      original_name: file.name,
      storage_path: filename,
      public_url: publicUrl,
      mime_type: file.type,
      extension,
      size_bytes: file.size,
      width,
      height,
    });

    if (!result.success) {
      // Best-effort cleanup of the newly uploaded object; the old file is untouched.
      supabase.storage.from(MEDIA_BUCKET).remove([filename]);
      return result;
    }

    // Old file no longer referenced; remove best-effort.
    supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
    return ok(result.data);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Replace failed.");
  }
}
