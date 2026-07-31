import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type {
  DbTestimonial,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from "@/types/testimonial";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "testimonials" as const;

export function rowToDbTestimonial(
  row: Database["public"]["Tables"]["testimonials"]["Row"],
): DbTestimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    quote: row.quote,
    rating: row.rating,
    avatar: row.avatar,
    display_order: row.display_order,
    status: row.status as DbTestimonial["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getTestimonials(): Promise<Result<DbTestimonial[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToDbTestimonial));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list testimonials");
  }
}

export async function getTestimonialById(id: string): Promise<Result<DbTestimonial>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Testimonial with id "${id}" not found`);
    return ok(rowToDbTestimonial(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch testimonial");
  }
}

export async function createTestimonial(
  input: CreateTestimonialInput,
): Promise<Result<DbTestimonial>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create testimonial — no data returned.");
    return ok(rowToDbTestimonial(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create testimonial");
  }
}

export async function updateTestimonial(
  id: string,
  input: UpdateTestimonialInput,
): Promise<Result<DbTestimonial>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Testimonial with id "${id}" not found.`);
    return ok(rowToDbTestimonial(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update testimonial");
  }
}

export async function deleteTestimonial(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete testimonial");
  }
}
