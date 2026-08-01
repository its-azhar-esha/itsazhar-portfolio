export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  bucket: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string;
  extension: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  folder: string;
  tags: string[];
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateMediaInput = Omit<MediaFile, "id" | "uploaded_by" | "created_at" | "updated_at">;

export interface UpdateMediaInput {
  original_name?: string;
  alt_text?: string | null;
  caption?: string | null;
  folder?: string;
  tags?: string[];
}

/** A media folder with the number of files inside it. */
export interface MediaFolder {
  folder: string;
  count: number;
}

/** A media file that is not referenced anywhere in the CMS. */
export interface UnusedMediaItem {
  media: MediaFile;
  usage: MediaUsageItem[];
}

/** File metadata for replacing the underlying file of an existing media record. */
export type ReplaceMediaInput = Pick<
  MediaFile,
  | "filename"
  | "original_name"
  | "storage_path"
  | "public_url"
  | "mime_type"
  | "extension"
  | "size_bytes"
  | "width"
  | "height"
>;

/**
 * Broad media kind derived from mime_type.
 * Future-ready: PDF, video, SVG and audio map here without API changes.
 */
export type MediaKind = "image" | "video" | "audio" | "document" | "other";

export type MediaSort = "newest" | "oldest" | "name_asc" | "name_desc" | "size_asc" | "size_desc";

export interface MediaPage {
  items: MediaFile[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** A single place where a media reference is used, grouped per record. */
export interface MediaUsageItem {
  kind: "hero" | "about" | "project" | "seo" | "content";
  id: string;
  title: string;
  fields: string[];
}
