export type ProjectStatus = "Production Ready" | "In Development" | "Prototype" | "Completed";

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
}
