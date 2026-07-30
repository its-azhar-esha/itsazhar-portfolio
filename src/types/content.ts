export type ContentStatus = "draft" | "published" | "archived";

export interface ContentEntry {
  id: string;
  key: string;
  title: string;
  content: Record<string, unknown>;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export type CreateContentInput = Omit<ContentEntry, "id" | "created_at" | "updated_at">;
export type UpdateContentInput = Partial<Omit<ContentEntry, "id" | "created_at" | "updated_at">>;
