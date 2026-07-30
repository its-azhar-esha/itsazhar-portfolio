import type { DbProject, CreateProjectInput, UpdateProjectInput } from "@/types/project";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { MOCK_PROJECTS } from "./mock-data";
import type { ProjectFilter, ProjectListResult } from "./types";

function applyFilters(items: DbProject[], filter: ProjectFilter): DbProject[] {
  let result = [...items];

  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.industry.some((i) => i.toLowerCase().includes(q)),
    );
  }

  if (filter.industry) {
    result = result.filter((p) =>
      p.industry.some((i) => i.toLowerCase() === filter.industry!.toLowerCase()),
    );
  }

  if (filter.featured !== undefined) {
    result = result.filter((p) => p.featured === filter.featured);
  }

  if (filter.status) {
    result = result.filter((p) => p.status === filter.status);
  }

  if (filter.category) {
    result = result.filter((p) => p.category.toLowerCase() === filter.category!.toLowerCase());
  }

  return result;
}

function applySorting(items: DbProject[], sort: string): DbProject[] {
  const sorted = [...items];
  switch (sort) {
    case "created_at_desc":
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case "created_at_asc":
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case "title_asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title_desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "featured_desc":
      sorted.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
      break;
  }
  return sorted;
}

function paginate(
  items: DbProject[],
  page: number,
  pageSize: number,
): { items: DbProject[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return { items: paged, total, totalPages };
}

async function getData(): Promise<DbProject[]> {
  return MOCK_PROJECTS;
}

export async function getProjects(
  filter: ProjectFilter = {},
): Promise<Result<ProjectListResult<DbProject>>> {
  try {
    const data = await getData();
    const filtered = applyFilters(data, filter);
    const sorted = applySorting(filtered, filter.sort ?? "created_at_desc");
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const { items, total, totalPages } = paginate(sorted, page, pageSize);
    return ok({
      items,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch projects");
  }
}

export async function getProject(id: string): Promise<Result<DbProject>> {
  try {
    const data = await getData();
    const project = data.find((p) => p.id === id);
    if (!project) return fail(`Project with id "${id}" not found`);
    return ok(project);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch project");
  }
}

export async function getProjectBySlug(slug: string): Promise<Result<DbProject>> {
  try {
    const data = await getData();
    const project = data.find((p) => p.slug === slug);
    if (!project) return fail(`Project with slug "${slug}" not found`);
    return ok(project);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch project by slug");
  }
}

export async function searchProjects(query: string): Promise<Result<DbProject[]>> {
  try {
    const data = await getData();
    const q = query.toLowerCase();
    const results = data.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.industry.some((i) => i.toLowerCase().includes(q)),
    );
    return ok(results);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to search projects");
  }
}

export async function getFeaturedProjects(): Promise<Result<DbProject[]>> {
  try {
    const data = await getData();
    const featured = data.filter((p) => p.featured);
    return ok(featured);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch featured projects");
  }
}

export async function getProjectsByIndustry(industry: string): Promise<Result<DbProject[]>> {
  try {
    const data = await getData();
    const results = data.filter((p) =>
      p.industry.some((i) => i.toLowerCase() === industry.toLowerCase()),
    );
    return ok(results);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch projects by industry");
  }
}

export async function createProject(input: CreateProjectInput): Promise<Result<DbProject>> {
  try {
    const project: DbProject = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      ...input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_PROJECTS.push(project);
    return ok(project);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create project");
  }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Result<DbProject>> {
  try {
    const index = MOCK_PROJECTS.findIndex((p) => p.id === id);
    if (index === -1) return fail(`Project with id "${id}" not found`);
    MOCK_PROJECTS[index] = {
      ...MOCK_PROJECTS[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return ok(MOCK_PROJECTS[index]);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update project");
  }
}

export async function deleteProject(id: string): Promise<Result<void>> {
  try {
    const index = MOCK_PROJECTS.findIndex((p) => p.id === id);
    if (index === -1) return fail(`Project with id "${id}" not found`);
    MOCK_PROJECTS.splice(index, 1);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete project");
  }
}
