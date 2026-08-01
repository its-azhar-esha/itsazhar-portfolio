"use server";

import { createClient } from "@/lib/supabase/server";
import { getLoginHistory, type LoginEntry } from "./repository";
import { listAuditLog, type AuditEntry } from "@/lib/audit";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";

export async function getLoginHistoryAction(limit = 50): Promise<Result<LoginEntry[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getLoginHistory(limit);
  } catch (err) {
    logError("getLoginHistoryAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to fetch login history");
  }
}

export async function getAuditLogAction(
  limit = 100,
  entity?: string,
): Promise<Result<AuditEntry[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return ok(await listAuditLog(limit, entity));
  } catch (err) {
    logError("getAuditLogAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to fetch activity log");
  }
}
