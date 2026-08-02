"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createProjectSchema,
  updateProjectSchema,
  createProjectDraftSchema,
  updateProjectDraftSchema,
} from "@/lib/validation";
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
import { fail } from "@/lib/result";
import { resolveMediaValue, resolveMediaValues } from "@/lib/media/repository";
import { createProject, updateProject, deleteProject } from "./repository";
import { rowToDbProject } from "./mappers";

export async function createProjectAction(
  input: Record<string, unknown>,
): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = (
      input.status === "draft" ? createProjectDraftSchema : createProjectSchema
    ).safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createProject(parsed.data as never, user.id);
    if (result.success) {
      revalidatePath("/admin/projects");
      await logAudit({
        action: "project.created",
        entity: "projects",
        entityId: result.data.id,
        detail: { slug: result.data.slug },
      });
    }
    return result;
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

    const parsed = (
      input.status === "draft" ? updateProjectDraftSchema : updateProjectSchema
    ).safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateProject(id, parsed.data as never, user.id);
    if (result.success) {
      revalidatePath("/admin/projects");
      await logAudit({
        action: "project.updated",
        entity: "projects",
        entityId: id,
        detail: { slug: result.data.slug },
      });
    }
    return result;
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

    const result = await deleteProject(id, user.id);
    if (result.success) {
      revalidatePath("/admin/projects");
      await logAudit({ action: "project.deleted", entity: "projects", entityId: id });
    }
    return result;
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
      .from("projects")
      .select("*")
      .in("status", ["active"])
      .or("scheduled_for.is.null,scheduled_for.lte.now")
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
      .from("projects")
      .select("*")
      .in("status", ["active"])
      .eq("slug", slug)
      .or("scheduled_for.is.null,scheduled_for.lte.now")
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
    const { data, error } = await supabase
      .from("projects")
      .select("slug")
      .in("status", ["active"])
      .or("scheduled_for.is.null,scheduled_for.lte.now");
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
    const related = projects.filter(
      (p) =>
        p.slug !== slug &&
        (Array.isArray(p.industry)
          ? p.industry.some((i) => industry.includes(i))
          : industry.includes(p.industry as string)),
    );
    if (related.length >= limit) return related.slice(0, limit);
    // No (or few) industry matches — fill the slots with random projects so
    // recommendations always render and are clickable.
    const others = projects.filter((p) => p.slug !== slug).sort(() => Math.random() - 0.5);
    const byIndustry = new Set(related.map((p) => p.slug));
    return [...related, ...others.filter((p) => !byIndustry.has(p.slug))].slice(0, limit);
  } catch {
    return getMockRelated(slug, limit);
  }
}
