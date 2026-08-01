import type { Database } from "@/database.types";
import type { DbProject } from "@/types/project";

/**
 * Normalizes a text[] / jsonb / legacy text value into a string array.
 * The hosted projects table stored `industry` as text containing PostgreSQL
 * array literal strings ('{"Logistics", "Transportation"}'); this parses
 * both that form and proper JSON arrays so admin forms and public renders
 * never receive a non-array value for an array-typed field.
 */
export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      // not JSON — fall through to PostgreSQL literal parsing
    }
  }
  if (trimmed.startsWith("{")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim().replace(/^"+|"+$/g, ""))
      .filter(Boolean);
  }
  return [trimmed];
}

/** Maps a projects table row to the domain DbProject model. */
export function rowToDbProject(row: Database["public"]["Tables"]["projects"]["Row"]): DbProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: row.short_description,
    description: row.description,
    industry: normalizeStringArray(row.industry),
    category: row.category,
    technologies: normalizeStringArray(row.technologies),
    thumbnail: row.thumbnail,
    images: normalizeStringArray(row.images),
    video_url: row.video_url,
    client: row.client,
    demo_url: row.demo_url,
    github_url: row.github_url,
    featured: row.featured,
    status: row.status as DbProject["status"],
    scheduled_for: row.scheduled_for,
    order: row.order,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    keywords: normalizeStringArray(row.keywords),
    og_image: row.og_image,
    canonical_url: row.canonical_url,
    challenge: row.challenge ?? null,
    solution: row.solution ?? null,
    workflow: normalizeStringArray(row.workflow),
    impact: row.impact ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
