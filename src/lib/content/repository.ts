import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { ContentEntry, CreateContentInput, UpdateContentInput } from "@/types/content";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { MOCK_CONTENT } from "./mock-data";

const TABLE = "content_entries" as const;

function rowToContentEntry(
  row: Database["public"]["Tables"]["content_entries"]["Row"],
): ContentEntry {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    content: (row.content as Record<string, unknown>) ?? {},
    status: row.status as ContentEntry["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function list(): Promise<Result<ContentEntry[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      return ok(MOCK_CONTENT);
    }
    return ok(data.map(rowToContentEntry));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list content");
  }
}

export async function findByKey(key: string): Promise<Result<ContentEntry | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("key", key).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(rowToContentEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to find content");
  }
}

export async function create(input: CreateContentInput): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("key", input.key)
      .maybeSingle();
    if (existing) return fail(`Content with key "${input.key}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create content — no data returned.");
    return ok(rowToContentEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create content");
  }
}

export async function update(id: string, input: UpdateContentInput): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();

    if (input.key) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("key", input.key)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another entry already uses key "${input.key}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Content with id "${id}" not found.`);
    return ok(rowToContentEntry(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update content");
  }
}

export async function remove(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete content");
  }
}
