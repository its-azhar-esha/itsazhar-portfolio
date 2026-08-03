export type ProjectStatus = "Production Ready" | "In Development" | "Prototype" | "Completed";

// Content-layer project (existing — used by public pages)
export interface Project {
  slug: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  tags: string[];
  hasVideo?: boolean;
  challenge?: string;
  solution?: string;
  workflow?: string[];
  impact?: string;
  keyFeatures?: string[];
  futureScope?: string[];
  tech?: string[];
  status?: ProjectStatus;
  industry: string | string[];
  year?: number;
  client?: string;
  demoUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  coverImage?: string;
  gallery?: string[];
  featured?: boolean;
  featuredOrder?: number;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  canonical_url?: string;
  keywords?: string[];
}

// Database canonical model (admin CMS source of truth)
export type DbProjectStatus = "draft" | "active" | "archived";

export interface DbProject {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string | null;
  thumbnail: string | null;
  images: string[];
  video_url: string | null;
  industry: string[];
  technologies: string[];
  category: string;
  featured: boolean;
  status: DbProjectStatus;
  scheduled_for: string | null;
  order: number;
  client: string | null;
  demo_url: string | null;
  github_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  keywords: string[];
  challenge: string | null;
  solution: string | null;
  workflow: string[];
  impact: string | null;
  key_features: string[];
  future_scope: string[] | null;
  created_at: string;
  updated_at: string;
}

export type CreateProjectInput = Omit<DbProject, "id" | "created_at" | "updated_at">;
export type UpdateProjectInput = Partial<Omit<DbProject, "id" | "created_at" | "updated_at">>;
