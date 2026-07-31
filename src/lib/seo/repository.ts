import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { SeoEntry, CreateSeoInput, UpdateSeoInput } from "@/types/seo";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "seo_metadata" as const;

function rowToSeoEntry(row: Database["public"]["Tables"]["seo_metadata"]["Row"]): SeoEntry {
  return {
    id: row.id,
    page_key: row.page_key,
    title: row.title,
    description: row.description,
    keywords: (row.keywords as string[]) ?? [],
    og_image: row.og_image,
    canonical_url: row.canonical_url,
    robots: row.robots,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSeoByPageKey(pageKey: string): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`SEO entry with page key "${pageKey}" not found`);
    return ok(rowToSeoEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch SEO entry");
  }
}

export async function getSeoById(id: string): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`SEO entry with id "${id}" not found`);
    return ok(rowToSeoEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch SEO entry");
  }
}

export async function getAllSeo(): Promise<Result<SeoEntry[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToSeoEntry));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list SEO entries");
  }
}

export async function createSeo(input: CreateSeoInput): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("page_key", input.page_key)
      .maybeSingle();
    if (existing) return fail(`SEO entry with page key "${input.page_key}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create SEO entry — no data returned.");
    return ok(rowToSeoEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create SEO entry");
  }
}

export async function updateSeo(id: string, input: UpdateSeoInput): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();

    if (input.page_key) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("page_key", input.page_key)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another entry already uses page key "${input.page_key}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`SEO entry with id "${id}" not found.`);
    return ok(rowToSeoEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update SEO entry");
  }
}

export async function deleteSeo(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete SEO entry");
  }
}
