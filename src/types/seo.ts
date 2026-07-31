export interface SeoEntry {
  id: string;
  page_key: string;
  title: string;
  description: string | null;
  keywords: string[];
  og_image: string | null;
  canonical_url: string | null;
  robots: string;
  created_at: string;
  updated_at: string;
}

export type CreateSeoInput = Omit<SeoEntry, "id" | "created_at" | "updated_at">;
export type UpdateSeoInput = Partial<Omit<SeoEntry, "id" | "created_at" | "updated_at">>;
