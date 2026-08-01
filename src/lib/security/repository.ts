/**
 * Security/audit repository (server-only, service role).
 *
 * Records and reads sign-in attempts from `login_history`. Recording is
 * best-effort: a failed write must never break the sign-in flow.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/database.types";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "login_history" as const;

type LoginRow = Database["public"]["Tables"]["login_history"]["Row"];

export interface LoginEntry {
  id: string;
  email: string;
  success: boolean;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export function rowToLoginEntry(row: LoginRow): LoginEntry {
  return {
    id: row.id,
    email: row.email,
    success: row.success,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export interface RecordLoginInput {
  email: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

export async function recordLoginAttempt(input: RecordLoginInput): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await supabase.from(TABLE).insert({
      email: input.email,
      success: input.success,
      ip: input.ip ?? "",
      user_agent: input.userAgent ?? "",
    } as never);
  } catch {
    // best-effort
  }
}

export async function getLoginHistory(limit = 50): Promise<Result<LoginEntry[]>> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(200, Math.max(1, limit)));
    if (error) return fail(error.message);
    return ok(((data ?? []) as LoginRow[]).map(rowToLoginEntry));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch login history");
  }
}
