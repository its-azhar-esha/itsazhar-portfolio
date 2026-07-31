import { MOCK_PROJECTS } from "./mock-data";
import type { Project, ProjectStatus, DbProject } from "@/types/project";

const STATUS_MAP: Record<string, ProjectStatus | undefined> = {
  active: "Production Ready",
  draft: "In Development",
  archived: "Completed",
};

export function toProject(db: DbProject): Project {
  const industry = db.industry.length > 1 ? db.industry : db.industry[0] || "";
  return {
    slug: db.slug,
    name: db.title,
    category: db.category,
    description: db.short_description,
    longDescription: db.description || db.short_description,
    tags: db.technologies,
    hasVideo: !!db.video_url,
    challenge: db.challenge ?? undefined,
    solution: db.solution ?? undefined,
    workflow: db.workflow ?? undefined,
    impact: db.impact ?? undefined,
    tech: db.technologies,
    status: STATUS_MAP[db.status],
    industry,
    year: new Date(db.created_at).getFullYear(),
    client: db.client ?? undefined,
    demoUrl: db.demo_url ?? undefined,
    githubUrl: db.github_url ?? undefined,
    coverImage: db.thumbnail ?? undefined,
    gallery: db.images.length > 0 ? db.images : undefined,
    featured: db.featured,
    featuredOrder: db.order,
    seo_title: db.seo_title ?? undefined,
    seo_description: db.seo_description ?? undefined,
    og_image: db.og_image ?? undefined,
    canonical_url: db.canonical_url ?? undefined,
    keywords: db.keywords ?? undefined,
  };
}

export function getMockProjects(): Project[] {
  return MOCK_PROJECTS.filter((p) => p.status === "active")
    .sort((a, b) => a.order - b.order)
    .map(toProject);
}

export function getMockProject(slug: string): Project | null {
  const mock = MOCK_PROJECTS.find((p) => p.slug === slug && p.status === "active");
  return mock ? toProject(mock) : null;
}

export function getMockSlugs(): string[] {
  return MOCK_PROJECTS.filter((p) => p.status === "active").map((p) => p.slug);
}

export function getMockAdjacent(slug: string): { prev: Project | null; next: Project | null } {
  const all = getMockProjects();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function getMockRelated(slug: string, limit = 3): Project[] {
  const all = getMockProjects();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const industry = Array.isArray(current.industry) ? current.industry : [current.industry];
  return all
    .filter(
      (p) =>
        p.slug !== slug &&
        (Array.isArray(p.industry)
          ? p.industry.some((i) => industry.includes(i))
          : industry.includes(p.industry as string)),
    )
    .slice(0, limit);
}
