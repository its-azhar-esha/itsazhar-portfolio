"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCaseStudySchema, updateCaseStudySchema } from "@/lib/validation";
import { createCaseStudy, updateCaseStudy, deleteCaseStudy } from "./repository";
import type {
  DbCaseStudy,
  CreateCaseStudyInput,
  UpdateCaseStudyInput,
  PublicCaseStudy,
} from "@/types/case-study";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { MOCK_CASE_STUDIES, toPublicCaseStudy } from "./mock-data";
import { rowToDbCaseStudy } from "./repository";

const TABLE = "case_studies" as const;

function revalidateCaseStudyPaths(slug?: string): void {
  revalidatePath("/admin/case-studies");
  revalidatePath("/");
  if (slug) revalidatePath(`/case-studies/${slug}`);
}

export async function createCaseStudyAction(
  input: Record<string, unknown>,
): Promise<Result<DbCaseStudy>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createCaseStudySchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createCaseStudy(parsed.data as CreateCaseStudyInput);
    if (result.success) revalidateCaseStudyPaths(parsed.data.slug);
    return result;
  } catch (err) {
    logError("createCaseStudyAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create case study");
  }
}

export async function updateCaseStudyAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<DbCaseStudy>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateCaseStudySchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateCaseStudy(id, parsed.data as UpdateCaseStudyInput);
    if (result.success) revalidateCaseStudyPaths(parsed.data.slug);
    return result;
  } catch (err) {
    logError("updateCaseStudyAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update case study");
  }
}

export async function deleteCaseStudyAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteCaseStudy(id);
    if (result.success) revalidateCaseStudyPaths();
    return result;
  } catch (err) {
    logError("deleteCaseStudyAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete case study");
  }
}

export async function publishCaseStudyAction(id: string): Promise<Result<DbCaseStudy>> {
  return updateCaseStudyAction(id, { status: "published" });
}

export async function draftCaseStudyAction(id: string): Promise<Result<DbCaseStudy>> {
  return updateCaseStudyAction(id, { status: "draft" });
}

/* ─── Public read server actions ─── */

export async function getPublicCaseStudiesAction(): Promise<PublicCaseStudy[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) {
      return MOCK_CASE_STUDIES.filter((cs) => cs.status === "published").map(toPublicCaseStudy);
    }
    return data.map(rowToDbCaseStudy).map(toPublicCaseStudy);
  } catch {
    return MOCK_CASE_STUDIES.filter((cs) => cs.status === "published").map(toPublicCaseStudy);
  }
}
