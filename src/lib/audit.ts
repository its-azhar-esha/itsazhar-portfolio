/**
 * Audit log helper (server-only).
 *
 * Appends an entry to `audit_log`. Doubles as the admin Activity Log.
 * Best-effort by design: audit failures must never break the action
 * being audited.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuditInput {
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  detail: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: unknown;
  created_by: string | null;
  created_at: string;
};

export async function listAuditLog(
  limit = 100,
  entity?: string,
): Promise<AuditEntry[]> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(500, Math.max(1, limit)));
    if (entity && entity.trim() !== "") query = query.eq("entity", entity.trim());
    const { data } = await query;
    return ((data ?? []) as AuditRow[])
      .filter((r) => Boolean(r))
      .map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entity_id,
        detail: (r.detail ?? {}) as Record<string, unknown>,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }));
  } catch {
    return [];
  }
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const admin = createAdminClient();

    let createdBy: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      createdBy = data.user?.email ?? null;
    } catch {
      // Not in a request context (e.g. cron/build) — created_by stays null.
    }

    await admin.from("audit_log").insert({
      action: input.action,
      entity: input.entity ?? "",
      entity_id: input.entityId ?? "",
      detail: input.detail ?? {},
      created_by: createdBy,
    } as never);
  } catch (err) {
    console.error("[audit] failed to write log:", err instanceof Error ? err.message : err);
  }
}
