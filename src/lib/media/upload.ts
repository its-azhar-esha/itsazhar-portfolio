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
  folder?: string;
  tags?: string[];
}

/** Client-side security gate: mime type + size. */
export function validateMediaFile(file: File): string | null {
  const mime = file.type;
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(mime as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
    const label = mime || "unknown";
    return `Unsupported file type "${label}". Allowed: images (JPG, PNG, WebP, GIF, AVIF, SVG), videos (MP4, WebM, MOV, MKV, OGV), audio (MP3, WAV, OGG, M4A, AAC, FLAC), documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, TXT, MD) and archives (ZIP).`;
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

  const headers = (extra: Record<string, string> = {}) => ({
    Authorization: `Bearer ${session.access_token}`,
    apikey: env.supabaseAnonKey,
    "Tus-Resumable": "1.0.0",
    ...extra,
  });

  const toBase64 = (value: string) => btoa(value);
  const uploadMetadata = [
    `bucketName ${toBase64(MEDIA_BUCKET)}`,
    `objectName ${toBase64(storagePath)}`,
    `contentType ${toBase64(file.type)}`,
    `cacheControl ${toBase64("3600")}`,
  ].join(",");

  const create = () =>
    fetch(`${env.supabaseUrl}/storage/v1/upload/resumable`, {
      method: "POST",
      headers: headers({
        "Upload-Length": String(file.size),
        "Upload-Metadata": uploadMetadata,
        "x-upsert": "false",
      }),
    });

  const createResponse = await create();
  if (createResponse.status === 409) {
    throw new Error("A file with this name already exists. Try again or replace the file.");
  }
  if (createResponse.status === 413) {
    throw new Error(`File exceeds the ${formatBytes(MAX_MEDIA_FILE_SIZE_BYTES)} storage limit.`);
  }
  if (!createResponse.ok) {
    throw new Error(`Upload failed (${createResponse.status}): ${await safeBody(createResponse)}`);
  }

  const location = createResponse.headers.get("Location");
  if (!location) throw new Error("Upload failed: storage did not return an upload URL.");
  const uploadUrl = location.startsWith("/") ? `${env.supabaseUrl}${location}` : location;

  try {
    await sendChunks(file, uploadUrl, headers, onProgress);
  } catch (err) {
    // Best-effort: terminate the resumable upload so no orphaned object lingers.
    try {
      await fetch(uploadUrl, { method: "DELETE", headers: headers() });
    } catch {
      // ignore cleanup failure
    }
    throw err;
  }
}

const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const TUS_MAX_ATTEMPTS = 3;

async function sendChunks(
  file: File,
  uploadUrl: string,
  headers: (extra?: Record<string, string>) => Record<string, string>,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<void> {
  let offset = 0;
  let attempts = 0;
  let lastStatus = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + TUS_CHUNK_SIZE, file.size));
    const status = await patchChunk(uploadUrl, chunk, offset, headers, (loaded) => {
      onProgress?.({
        percent: Math.round(((offset + loaded) / file.size) * 100),
        uploadedBytes: offset + loaded,
        totalBytes: file.size,
      });
    });
    lastStatus = status;

    if (status === 204) {
      attempts = 0;
      offset = Math.min(offset + chunk.size, file.size);
      continue;
    }

    if (status === 413) {
      throw new Error(`File exceeds the ${formatBytes(MAX_MEDIA_FILE_SIZE_BYTES)} storage limit.`);
    }

    // Resume from the server's current offset (handles dropped connections).
    attempts += 1;
    const serverOffset = await getUploadOffset(uploadUrl, headers);
    if (serverOffset != null) {
      if (serverOffset === file.size) return;
      if (serverOffset > offset) {
        attempts = 0;
        offset = serverOffset;
        continue;
      }
    }
    if (attempts >= TUS_MAX_ATTEMPTS) {
      throw new Error(
        `Upload stalled after several retries (last server response: ${lastStatus}). Check your connection and try again.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
  }
}

function patchChunk(
  uploadUrl: string,
  chunk: Blob,
  offset: number,
  headers: (extra?: Record<string, string>) => Record<string, string>,
  onChunkProgress?: (loadedBytes: number) => void,
): Promise<number> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", uploadUrl);
    xhr.setRequestHeader("Authorization", headers().Authorization);
    xhr.setRequestHeader("apikey", headers().apikey);
    xhr.setRequestHeader("Tus-Resumable", "1.0.0");
    xhr.setRequestHeader("Upload-Offset", String(offset));
    xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onChunkProgress) return;
      onChunkProgress(event.loaded);
    };
    xhr.onload = () => resolve(xhr.status);
    xhr.onerror = () => resolve(0);
    xhr.onabort = () => resolve(0);
    xhr.send(chunk);
  });
}

async function getUploadOffset(
  uploadUrl: string,
  headers: (extra?: Record<string, string>) => Record<string, string>,
): Promise<number | null> {
  try {
    const response = await fetch(uploadUrl, { method: "HEAD", headers: headers() });
    if (!response.ok) return null;
    const value = response.headers.get("Upload-Offset");
    return value === null ? null : Number.parseInt(value, 10);
  } catch {
    return null;
  }
}

async function safeBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return "Unknown error";
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      return parsed.message || parsed.error || text.slice(0, 200);
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return "Unknown error";
  }
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
      folder: options.folder?.trim() ? options.folder.trim() : "media",
      tags: options.tags ?? [],
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
