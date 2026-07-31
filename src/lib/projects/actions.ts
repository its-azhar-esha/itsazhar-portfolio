"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation";
import type { Database } from "@/database.types";
import type { DbProject, Project } from "@/types/project";
import {
  toProject,
  getMockProjects,
  getMockProject,
  getMockSlugs,
  getMockAdjacent,
  getMockRelated,
} from "./public";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { resolveMediaValue, resolveMediaValues } from "@/lib/media/repository";

const TABLE = "projects" as const;

function rowToDbProject(row: Database["public"]["Tables"]["projects"]["Row"]): DbProject {
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

export async function createProjectAction(
  input: Record<string, unknown>,
): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const { slug } = parsed.data;
    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) return fail(`A project with slug "${slug}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(parsed.data as never)
      .select()
      .single();

    if (error) return fail(error.message);
    if (!data) return fail("Failed to create project — no data returned.");

    revalidatePath("/admin/projects");
    return ok(rowToDbProject(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create project");
  }
}

export async function updateProjectAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const { slug } = parsed.data;
    if (slug) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another project already uses slug "${slug}".`);
    }

    const updatePayload = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    } as never;

    const { data, error } = await supabase
      .from(TABLE)
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return fail(error.message);
    if (!data) return fail(`Project with id "${id}" not found.`);

    revalidatePath("/admin/projects");
    return ok(rowToDbProject(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update project");
  }
}

export async function deleteProjectAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/admin/projects");
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete project");
  }
}

export async function publishProjectAction(id: string): Promise<Result<DbProject>> {
  return updateProjectAction(id, { status: "active" });
}

/* ─── Public read server actions ─── */

async function resolveProjectMedia(project: Project): Promise<Project> {
  const cover = project.coverImage ? await resolveMediaValue(project.coverImage) : null;
  const og = project.og_image ? await resolveMediaValue(project.og_image) : null;
  const gallery = project.gallery?.length ? await resolveMediaValues(project.gallery) : [];
  return {
    ...project,
    coverImage: cover ?? project.coverImage,
    og_image: og ?? project.og_image,
    gallery: project.gallery ? gallery.filter((v): v is string => v !== null) : undefined,
  };
}

export async function getPublicProjectsAction(): Promise<Project[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", ["active"])
      .order("order", { ascending: true });
    if (error || !data || data.length === 0) return getMockProjects();
    return Promise.all(data.map((row) => resolveProjectMedia(toProject(rowToDbProject(row)))));
  } catch {
    return getMockProjects();
  }
}

export async function getPublicProjectAction(slug: string): Promise<Project | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", ["active"])
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return getMockProject(slug);
    return resolveProjectMedia(toProject(rowToDbProject(data)));
  } catch {
    return getMockProject(slug);
  }
}

export async function getPublicSlugsAction(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("slug").in("status", ["active"]);
    if (error || !data || data.length === 0) return getMockSlugs();
    return data.map((r: { slug: string }) => r.slug);
  } catch {
    return getMockSlugs();
  }
}

export async function getPublicAdjacentAction(
  slug: string,
): Promise<{ prev: Project | null; next: Project | null }> {
  try {
    const projects = await getPublicProjectsAction();
    const idx = projects.findIndex((p) => p.slug === slug);
    if (idx === -1) return getMockAdjacent(slug);
    return {
      prev: idx > 0 ? projects[idx - 1] : null,
      next: idx < projects.length - 1 ? projects[idx + 1] : null,
    };
  } catch {
    return getMockAdjacent(slug);
  }
}

export async function getPublicRelatedAction(slug: string, limit = 3): Promise<Project[]> {
  try {
    const projects = await getPublicProjectsAction();
    const current = projects.find((p) => p.slug === slug);
    if (!current) return getMockRelated(slug, limit);
    const industry = Array.isArray(current.industry) ? current.industry : [current.industry];
    return projects
      .filter(
        (p) =>
          p.slug !== slug &&
          (Array.isArray(p.industry)
            ? p.industry.some((i) => industry.includes(i))
            : industry.includes(p.industry as string)),
      )
      .slice(0, limit);
  } catch {
    return getMockRelated(slug, limit);
  }
}
