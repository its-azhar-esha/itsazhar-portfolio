/**
 * Content versioning repository (server-only, service role).
 *
 * Snapshots full rows into `content_versions` on every create/update so
 * admin users can browse, diff and restore previous states.
 * Best-effort by design: version capture must never break the write
 * that triggered it, so capture failures are swallowed (return null).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/database.types";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "content_versions" as const;

type VersionRow = Database["public"]["Tables"]["content_versions"]["Row"];

export interface ContentVersion {
  id: string;
  entity: string;
  entityId: string;
  version: number;
  data: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export function rowToContentVersion(row: VersionRow): ContentVersion {
  return {
    id: row.id,
    entity: row.entity,
    entityId: row.entity_id,
    version: row.version,
    data: (row.data ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

async function nextVersion(entity: string, entityId: string): Promise<number> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("entity", entity)
    .eq("entity_id", entityId)
    .order("version", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return 1;
  const latest = (data ?? []) as VersionRow[];
  return latest[0].version + 1;
}

export async function captureContentVersion(
  entity: string,
  entityId: string,
  data: unknown,
  createdBy?: string | null,
): Promise<ContentVersion | null> {
  try {
    const supabase = await createAdminClient();
    for (let attempt = 0; attempt < 2; attempt++) {
      const version = await nextVersion(entity, entityId);
      const { data: inserted, error } = await supabase
        .from(TABLE)
        .insert({
          entity,
          entity_id: entityId,
          version,
          data: data as never,
          created_by: createdBy ?? null,
        } as never)
        .select()
        .single();
      if (error) {
        if (error.code === "23505" && attempt === 0) continue; // unique collision → retry
        return null;
      }
      return rowToContentVersion(inserted as VersionRow);
    }
    return null;
  } catch {
    return null;
  }
}

export async function listContentVersions(
  entity: string,
  entityId: string,
): Promise<Result<ContentVersion[]>> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("entity", entity)
      .eq("entity_id", entityId)
      .order("version", { ascending: false });
    if (error) return fail(error.message);
    return ok(((data ?? []) as VersionRow[]).map(rowToContentVersion));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list content versions");
  }
}

export async function getContentVersionById(id: string): Promise<Result<ContentVersion>> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Content version "${id}" not found`);
    return ok(rowToContentVersion(data as VersionRow));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch content version");
  }
}

/** Removes all snapshots for a deleted entity (best-effort). */
export async function clearContentVersions(entity: string, entityId: string): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await supabase.from(TABLE).delete().eq("entity", entity).eq("entity_id", entityId);
  } catch {
    // best-effort
  }
}
