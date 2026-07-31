import { createClient } from "@/lib/supabase/server";
import type { DbProject, CreateProjectInput, UpdateProjectInput } from "@/types/project";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import type { ProjectFilter, ProjectListResult } from "./types";
import { rowToDbProject } from "./mappers";

const TABLE = "projects" as const;

/** Sanitizes free-text search input so it is safe inside PostgREST `.or()` filters. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,:]/g, " ").trim();
}

export async function getProjects(
  filter: ProjectFilter = {},
): Promise<Result<ProjectListResult<DbProject>>> {
  try {
    const supabase = await createClient();
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let builder = supabase.from(TABLE).select("*", { count: "exact" });

    if (filter.search) {
      const q = sanitizeSearch(filter.search);
      if (q) {
        const pattern = `%${q.toLowerCase()}%`;
        builder = builder.or(
          `title.ilike.${pattern},short_description.ilike.${pattern},description.ilike.${pattern}`,
        );
      }
    }
    if (filter.industry) {
      builder = builder.contains("industry", [filter.industry]);
    }
    if (filter.featured !== undefined) {
      builder = builder.eq("featured", filter.featured);
    }
    if (filter.status) {
      builder = builder.eq("status", filter.status);
    }
    if (filter.category) {
      builder = builder.ilike("category", filter.category);
    }

    switch (filter.sort ?? "created_at_desc") {
      case "created_at_desc":
        builder = builder.order("created_at", { ascending: false });
        break;
      case "created_at_asc":
        builder = builder.order("created_at", { ascending: true });
        break;
      case "title_asc":
        builder = builder.order("title", { ascending: true });
        break;
      case "title_desc":
        builder = builder.order("title", { ascending: false });
        break;
      case "featured_desc":
        builder = builder
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await builder.range(from, to);

    if (error) return fail(error.message);

    const total = count ?? 0;
    return ok({
      items: (data ?? []).map(rowToDbProject),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch projects");
  }
}

export async function getProject(id: string): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Project with id "${id}" not found`);
    return ok(rowToDbProject(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch project");
  }
}

export async function createProject(input: CreateProjectInput): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) return fail(`A project with slug "${input.slug}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create project — no data returned.");
    return ok(rowToDbProject(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create project");
  }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Result<DbProject>> {
  try {
    const supabase = await createClient();

    if (input.slug) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another project already uses slug "${input.slug}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...input, updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Project with id "${id}" not found.`);
    return ok(rowToDbProject(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update project");
  }
}

export async function deleteProject(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete project");
  }
}
