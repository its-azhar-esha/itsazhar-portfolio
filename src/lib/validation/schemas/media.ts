import { z } from "zod";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MEDIA_BUCKET,
  MEDIA_VALIDATION,
} from "@/constants/media";

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
    .max(MAX_MEDIA_FILE_SIZE_BYTES, "File exceeds the 10 MB limit"),
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
    .max(MAX_MEDIA_FILE_SIZE_BYTES, "File exceeds the 10 MB limit"),
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
