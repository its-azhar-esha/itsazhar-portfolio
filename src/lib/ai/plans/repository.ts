/**
 * admin_ai_plans — persistence for pending Admin AI change plans.
 *
 * Plans belong to the admin who created them (RLS enforces user_id = owner)
 * and expire a couple of hours after creation. All reads/writes use the
 * user's session client so RLS applies.
 */

import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import type { PlanAction, PlanActionPreview } from "@/lib/ai/tools/types";

export interface PlanRow {
  id: string;
  user_id: string;
  prompt: string;
  explanation: string;
  actions: PlanAction[];
  previews: PlanActionPreview[];
  results: unknown[];
  status: "draft" | "approved" | "applied" | "discarded" | "expired";
  created_at: string;
  updated_at: string;
  expires_at: string;
}

function toPlanRow(data: Record<string, unknown>): PlanRow {
  return {
    id: String(data.id),
    user_id: String(data.user_id),
    prompt: String(data.prompt ?? ""),
    explanation: String(data.explanation ?? ""),
    actions: (Array.isArray(data.actions) ? data.actions : []) as PlanAction[],
    previews: (Array.isArray(data.previews) ? data.previews : []) as PlanActionPreview[],
    results: (Array.isArray(data.results) ? data.results : []) as unknown[],
    status: (data.status as PlanRow["status"]) ?? "draft",
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    expires_at: String(data.expires_at),
  };
}

export async function createPlan(
  userId: string,
  data: {
    prompt: string;
    explanation: string;
    actions: PlanAction[];
    previews: PlanActionPreview[];
  },
): Promise<Result<PlanRow>> {
  try {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("admin_ai_plans")
      .insert({
        user_id: userId,
        prompt: data.prompt,
        explanation: data.explanation,
        actions: data.actions as never,
        previews: data.previews as never,
        results: [] as never,
      } as never)
      .select()
      .single();
    if (error) return fail(error.message);
    return ok(toPlanRow(row as unknown as Record<string, unknown>));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create plan");
  }
}

export async function updatePlan(
  userId: string,
  id: string,
  patch: {
    prompt?: string;
    explanation?: string;
    actions?: PlanAction[];
    previews?: PlanActionPreview[];
    results?: unknown[];
    status?: PlanRow["status"];
  },
): Promise<Result<PlanRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_ai_plans")
      .update({
        ...(patch.prompt !== undefined ? { prompt: patch.prompt } : {}),
        ...(patch.explanation !== undefined ? { explanation: patch.explanation } : {}),
        ...(patch.actions !== undefined ? { actions: patch.actions as never } : {}),
        ...(patch.previews !== undefined ? { previews: patch.previews as never } : {}),
        ...(patch.results !== undefined ? { results: patch.results as never } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return fail(error.message);
    return ok(toPlanRow(data as unknown as Record<string, unknown>));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update plan");
  }
}

/** The owner's latest draft plan (used to regenerate on follow-up messages). */
export async function getDraftPlan(userId: string): Promise<Result<PlanRow | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_ai_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "draft")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(toPlanRow(data as unknown as Record<string, unknown>));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load plan");
  }
}

export async function getPlan(userId: string, id: string): Promise<Result<PlanRow | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_ai_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(toPlanRow(data as unknown as Record<string, unknown>));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load plan");
  }
}

/** Fire-and-forget: expires drafts the owner never approved. */
export async function expireStalePlans(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("admin_ai_plans")
      .update({ status: "expired", updated_at: new Date().toISOString() } as never)
      .eq("status", "draft")
      .lte("expires_at", new Date().toISOString());
  } catch {
    // best-effort
  }
}
