"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import { createTestimonialSchema, updateTestimonialSchema } from "@/lib/validation";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  rowToDbTestimonial,
} from "./repository";
import { resolveMediaValue } from "@/lib/media/repository";
import type {
  DbTestimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput,
  PublicTestimonial,
} from "@/types/testimonial";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";

const TABLE = "testimonials" as const;

function revalidateTestimonialPaths(): void {
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function createTestimonialAction(
  input: Record<string, unknown>,
): Promise<Result<DbTestimonial>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createTestimonialSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createTestimonial(parsed.data as CreateTestimonialInput);
    if (result.success) revalidateTestimonialPaths();
    return result;
  } catch (err) {
    logError("createTestimonialAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create testimonial");
  }
}

export async function updateTestimonialAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<DbTestimonial>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateTestimonialSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateTestimonial(id, parsed.data as UpdateTestimonialInput);
    if (result.success) revalidateTestimonialPaths();
    return result;
  } catch (err) {
    logError("updateTestimonialAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update testimonial");
  }
}

export async function deleteTestimonialAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteTestimonial(id);
    if (result.success) revalidateTestimonialPaths();
    return result;
  } catch (err) {
    logError("deleteTestimonialAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete testimonial");
  }
}

export async function publishTestimonialAction(id: string): Promise<Result<DbTestimonial>> {
  return updateTestimonialAction(id, { status: "published" });
}

export async function draftTestimonialAction(id: string): Promise<Result<DbTestimonial>> {
  return updateTestimonialAction(id, { status: "draft" });
}

/* ─── Public read server action ─── */

export async function getPublicTestimonialsAction(): Promise<PublicTestimonial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return [];
    const rows: Database["public"]["Tables"]["testimonials"]["Row"][] = data ?? [];
    const resolved: PublicTestimonial[] = [];
    for (const row of rows) {
      resolved.push({
        ...rowToDbTestimonial(row),
        avatar: await resolveMediaValue(row.avatar),
      });
    }
    return resolved;
  } catch {
    return [];
  }
}
