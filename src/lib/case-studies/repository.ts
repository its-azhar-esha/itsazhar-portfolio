import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { DbCaseStudy, CreateCaseStudyInput, UpdateCaseStudyInput } from "@/types/case-study";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "case_studies" as const;

export function rowToDbCaseStudy(
  row: Database["public"]["Tables"]["case_studies"]["Row"],
): DbCaseStudy {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    challenge: row.challenge,
    solution: row.solution,
    workflow: (row.workflow as string[]) ?? [],
    impact: row.impact,
    icon: row.icon as DbCaseStudy["icon"],
    display_order: row.display_order,
    status: row.status as DbCaseStudy["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getCaseStudies(): Promise<Result<DbCaseStudy[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToDbCaseStudy));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list case studies");
  }
}

export async function getCaseStudyById(id: string): Promise<Result<DbCaseStudy>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Case study with id "${id}" not found`);
    return ok(rowToDbCaseStudy(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch case study");
  }
}

export async function createCaseStudy(input: CreateCaseStudyInput): Promise<Result<DbCaseStudy>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) return fail(`A case study with slug "${input.slug}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create case study — no data returned.");
    return ok(rowToDbCaseStudy(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create case study");
  }
}

export async function updateCaseStudy(
  id: string,
  input: UpdateCaseStudyInput,
): Promise<Result<DbCaseStudy>> {
  try {
    const supabase = await createClient();

    if (input.slug) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another case study already uses slug "${input.slug}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Case study with id "${id}" not found.`);
    return ok(rowToDbCaseStudy(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update case study");
  }
}

export async function deleteCaseStudy(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete case study");
  }
}
