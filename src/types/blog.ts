import type { BlogPostStatus } from "@/constants/blog";

export interface DbBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  categories: string[];
  tags: string[];
  author: string;
  status: BlogPostStatus;
  featured: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export type CreateBlogPostInput = Omit<DbBlogPost, "id" | "created_at" | "updated_at">;
export type UpdateBlogPostInput = Partial<Omit<DbBlogPost, "id" | "created_at" | "updated_at">>;

/** Public-facing post: media references resolved to URLs. */
export interface PublicBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categories: string[];
  tags: string[];
  author: string;
  featured: boolean;
  publishedAt: string;
  seo_title: string | null;
  seo_description: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  keywords: string[];
}
