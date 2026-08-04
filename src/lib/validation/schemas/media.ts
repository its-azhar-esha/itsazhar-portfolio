import { z } from "zod";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MEDIA_BUCKET,
  MEDIA_VALIDATION,
} from "@/constants/media";
import { formatBytes } from "@/lib/media/utils";

const MAX_MEDIA_FILE_SIZE_LABEL = formatBytes(MAX_MEDIA_FILE_SIZE_BYTES);

export const mediaFolderSchema = z
  .string()
  .trim()
  .max(60, "Folder must be 60 characters or fewer")
  .regex(/^[a-z0-9][a-z0-9-_ ]*$/i, "Folders can only contain letters, numbers, dashes and spaces")
  .or(z.literal(""));

export const mediaTagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(24, "Tags must be 24 characters or fewer")
  .regex(/^[a-z0-9][a-z0-9-_ ]*$/, "Tags can only contain letters, numbers, dashes and spaces");

export const createMediaRecordSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must be 255 characters or fewer"),
  original_name: z
    .string()
    .min(1, "Original name is required")
    .max(MEDIA_VALIDATION.ORIGINAL_NAME_MAX, "Name must be 255 characters or fewer"),
  bucket: z.string().min(1).default(MEDIA_BUCKET),
  storage_path: z
    .string()
    .min(1, "Storage path is required")
    .max(500, "Storage path must be 500 characters or fewer"),
  public_url: z.string().url("Must be a valid URL").nullable().default(null),
  mime_type: z.enum(ALLOWED_MEDIA_MIME_TYPES, {
    error:
      "Unsupported file type. Allowed: images (JPG, PNG, WebP, GIF, AVIF), videos (MP4, WebM, MOV) and documents (PDF, TXT).",
  }),
  extension: z
    .string()
    .min(1, "Extension is required")
    .max(20, "Extension must be 20 characters or fewer"),
  size_bytes: z
    .number()
    .int("Size must be a whole number")
    .nonnegative("Size cannot be negative")
    .max(MAX_MEDIA_FILE_SIZE_BYTES, `File exceeds the ${MAX_MEDIA_FILE_SIZE_LABEL} limit`),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  alt_text: z
    .string()
    .trim()
    .max(MEDIA_VALIDATION.ALT_TEXT_MAX, "Alt text must be 255 characters or fewer")
    .nullable()
    .default(null),
  caption: z
    .string()
    .trim()
    .max(MEDIA_VALIDATION.CAPTION_MAX, "Caption must be 500 characters or fewer")
    .nullable()
    .default(null),
  folder: mediaFolderSchema.default("media"),
  tags: z.array(mediaTagSchema).max(20, "A file can have at most 20 tags").default([]),
});

export const updateMediaMetadataSchema = z.object({
  original_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(MEDIA_VALIDATION.ORIGINAL_NAME_MAX, "Name must be 255 characters or fewer")
    .optional(),
  alt_text: z
    .string()
    .trim()
    .max(MEDIA_VALIDATION.ALT_TEXT_MAX, "Alt text must be 255 characters or fewer")
    .nullable()
    .optional()
    .or(z.literal("")),
  caption: z
    .string()
    .trim()
    .max(MEDIA_VALIDATION.CAPTION_MAX, "Caption must be 500 characters or fewer")
    .nullable()
    .optional()
    .or(z.literal("")),
  folder: mediaFolderSchema.optional(),
  tags: z.array(mediaTagSchema).max(20, "A file can have at most 20 tags").optional(),
});

export const bulkUpdateMediaSchema = z
  .object({
    ids: z.array(z.string().uuid("Invalid media id")).min(1, "Select at least one file").max(500),
    folder: mediaFolderSchema.optional(),
    tags: z.array(mediaTagSchema).max(20, "At most 20 tags per file").optional(),
  })
  .refine((value) => value.folder !== undefined || value.tags !== undefined, {
    message: "Choose a folder, tags, or both.",
  });

export const bulkDeleteMediaSchema = z.object({
  ids: z.array(z.string().uuid("Invalid media id")).min(1, "Select at least one file").max(500),
});

/** File metadata submitted when replacing a media record's underlying file. */
export const replaceMediaRecordSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must be 255 characters or fewer"),
  original_name: z
    .string()
    .min(1, "Original name is required")
    .max(MEDIA_VALIDATION.ORIGINAL_NAME_MAX, "Name must be 255 characters or fewer"),
  storage_path: z
    .string()
    .min(1, "Storage path is required")
    .max(500, "Storage path must be 500 characters or fewer"),
  public_url: z.string().url("Must be a valid URL").nullable().default(null),
  mime_type: z.enum(ALLOWED_MEDIA_MIME_TYPES, {
    error:
      "Unsupported file type. Allowed: images (JPG, PNG, WebP, GIF, AVIF), videos (MP4, WebM, MOV) and documents (PDF, TXT).",
  }),
  extension: z
    .string()
    .min(1, "Extension is required")
    .max(20, "Extension must be 20 characters or fewer"),
  size_bytes: z
    .number()
    .int("Size must be a whole number")
    .nonnegative("Size cannot be negative")
    .max(MAX_MEDIA_FILE_SIZE_BYTES, `File exceeds the ${MAX_MEDIA_FILE_SIZE_LABEL} limit`),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

/** A reference to a media_files row: `media:<uuid>`. */
export const mediaReferenceSchema = z
  .string()
  .regex(
    /^media:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    "Must be a media library reference or a valid URL",
  );

/** A legacy URL or a media library reference. */
export const mediaUrlOrReferenceSchema = z
  .string()
  .url("Must be a valid URL")
  .or(mediaReferenceSchema);

/**
 * Optional media value: accepts a URL, a `media:<uuid>` reference, an empty
 * string (forms send `""` for empty optional media fields), `null`, or
 * `undefined`, and normalizes empty values to `null` for storage.
 */
export const optionalMediaUrlOrReferenceSchema = mediaUrlOrReferenceSchema
  .or(z.literal(""))
  .nullish()
  .transform((v) => (v && v.trim() !== "" ? v : null));
