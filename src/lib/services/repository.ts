import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { DbService, CreateServiceInput, UpdateServiceInput } from "@/types/service";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "services" as const;

function rowToDbService(row: Database["public"]["Tables"]["services"]["Row"]): DbService {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    short_description: row.short_description,
    content: (row.content as Record<string, unknown>) ?? {},
    icon: row.icon as DbService["icon"],
    featured: row.featured,
    display_order: row.display_order,
    status: row.status as DbService["status"],
    scheduled_for: row.scheduled_for,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    seo_keywords: (row.seo_keywords as string[]) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getServices(): Promise<Result<DbService[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToDbService));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list services");
  }
}

export async function getServiceById(id: string): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Service with id "${id}" not found`);
    return ok(rowToDbService(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch service");
  }
}

export async function getServiceBySlug(slug: string): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Service with slug "${slug}" not found`);
    return ok(rowToDbService(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch service");
  }
}

export async function createService(input: CreateServiceInput): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) return fail(`A service with slug "${input.slug}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create service — no data returned.");
    return ok(rowToDbService(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create service");
  }
}

export async function updateService(
  id: string,
  input: UpdateServiceInput,
): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();

    if (input.slug) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another service already uses slug "${input.slug}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Service with id "${id}" not found.`);
    return ok(rowToDbService(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update service");
  }
}

export async function deleteService(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete service");
  }
}
