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
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateMediaInput = Omit<MediaFile, "id" | "uploaded_by" | "created_at" | "updated_at">;

export interface UpdateMediaInput {
  alt_text?: string | null;
  caption?: string | null;
}

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
