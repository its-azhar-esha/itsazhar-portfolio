import type { Database } from "@/database.types";
import type { DbProject } from "@/types/project";

/** Maps a projects table row to the domain DbProject model. */
export function rowToDbProject(row: Database["public"]["Tables"]["projects"]["Row"]): DbProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: row.short_description,
    description: row.description,
    industry: (row.industry as string[]) ?? [],
    category: row.category,
    technologies: (row.technologies as string[]) ?? [],
    thumbnail: row.thumbnail,
    images: (row.images as string[]) ?? [],
    video_url: row.video_url,
    client: row.client,
    demo_url: row.demo_url,
    github_url: row.github_url,
    featured: row.featured,
    status: row.status as DbProject["status"],
    order: row.order,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    keywords: (row.keywords as string[]) ?? [],
    og_image: row.og_image,
    canonical_url: row.canonical_url,
    challenge: row.challenge ?? null,
    solution: row.solution ?? null,
    workflow: (row.workflow as string[]) ?? [],
    impact: row.impact ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
