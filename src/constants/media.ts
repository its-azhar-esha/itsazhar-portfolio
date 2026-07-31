import type { MediaSort } from "@/types/media";

export const MEDIA_BUCKET = "media" as const;

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = ["application/pdf", "text/plain"] as const;

/** Everything the media library accepts. The storage bucket allows any type. */
export const ALLOWED_MEDIA_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;

export const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export const MEDIA_SORT_OPTIONS: { value: MediaSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "size_asc", label: "Size: small first" },
  { value: "size_desc", label: "Size: large first" },
];

export const MEDIA_DEFAULT_PAGE_SIZE = 12;

export const MEDIA_VALIDATION = {
  ALT_TEXT_MAX: 255,
  CAPTION_MAX: 500,
  ORIGINAL_NAME_MAX: 255,
} as const;
