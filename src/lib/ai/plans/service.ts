/**
 * Admin AI plans — orchestration.
 *
 * savePlan: computes previews from live data and persists (or refreshes) the
 *           owner's draft plan. Never applies anything.
 * approvePlan: applies every action through the tool registry's server
 *           actions, records per-action results, logs an audit entry and
 *           sends a notification. Only reachable from a draft plan owned by
 *           the requesting admin.
 * discardPlan: marks the draft as discarded.
 */

import { getTool } from "@/lib/ai/tools/registry";
import { computePlanPreviews } from "@/lib/ai/planner";
import type {
  PlanAction,
  PlanActionResult,
  PlanEnvelope,
  PlanActionPreview,
} from "@/lib/ai/tools/types";
import {
  createPlan,
  updatePlan,
  getDraftPlan,
  getPlan,
  expireStalePlans,
  type PlanRow,
} from "./repository";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/sender";

const PLAN_TTL_HOURS = 2;

function envelopeOf(plan: PlanRow): PlanEnvelope {
  return {
    id: plan.id,
    explanation: plan.explanation,
    actions: plan.previews,
    expiresAt: plan.expires_at,
  };
}

function withExpiry(plan: PlanRow): PlanRow {
  const expiresAt = new Date(Date.now() + PLAN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  return { ...plan, expires_at: expiresAt };
}

/**
 * Saves a new plan (or refreshes the owner's existing draft) with previews
 * computed from live data. Returns the envelope the client renders.
 */
export async function savePlan(
  userId: string,
  prompt: string,
  output: { explanation: string; actions: PlanAction[] },
): Promise<Result<PlanEnvelope>> {
  const previews = await computePlanPreviews(output.actions);

  const existing = await getDraftPlan(userId);
  if (existing.success && existing.data) {
    const updated = await updatePlan(userId, existing.data.id, {
      prompt,
      explanation: output.explanation,
      actions: output.actions,
      previews,
    });
    if (!updated.success) return fail(updated.error);
    return ok(envelopeOf(withExpiry(updated.data)));
  }

  const created = await createPlan(userId, {
    prompt,
    explanation: output.explanation,
    actions: output.actions,
    previews,
  });
  if (!created.success) return fail(created.error);
  return ok(envelopeOf(created.data));
}

/** Applies an approved plan. Only the owner of a still-valid draft can. */
export async function approvePlan(
  userId: string,
  planId: string,
): Promise<Result<{ results: PlanActionResult[]; summary: string }>> {
  const plan = await getPlan(userId, planId);
  if (!plan.success) return plan;
  if (!plan.data) return fail("Plan not found.");
  if (plan.data.status !== "draft") {
    return fail(`Plan is ${plan.data.status} — it can no longer be applied.`);
  }
  if (new Date(plan.data.expires_at).getTime() < Date.now()) {
    return fail("This plan has expired. Ask the assistant to regenerate it.");
  }

  const marked = await updatePlan(userId, planId, { status: "approved" });
  if (!marked.success) return fail(marked.error);

  const results: PlanActionResult[] = [];
  for (const action of plan.data.actions) {
    const tool = getTool(action.toolId);
    if (!tool) {
      results.push({
        toolId: action.toolId,
        label: "Unknown action",
        ok: false,
        message: "Unknown tool.",
      });
      continue;
    }
    try {
      const result = await tool.apply(action.params);
      results.push(
        result.success
          ? { toolId: tool.id, label: tool.label, ok: true, message: result.data.summary }
          : { toolId: tool.id, label: tool.label, ok: false, message: result.error },
      );
    } catch (err) {
      results.push({
        toolId: tool.id,
        label: tool.label,
        ok: false,
        message: err instanceof Error ? err.message : "Apply failed.",
      });
    }
  }

  await updatePlan(userId, planId, {
    status: "applied",
    results: results as unknown[],
  });

  const okCount = results.filter((r) => r.ok).length;
  await logAudit({
    action: "ai.plan.applied",
    entity: "admin_ai_plans",
    entityId: planId,
    detail: { total: results.length, ok: okCount, actions: results.map((r) => r.toolId) },
  });
  await notify("admin.ai.applied", {
    fields: { Actions: String(results.length), Ok: String(okCount) },
  });

  const summary =
    results.length === 0
      ? "The plan contained no actions."
      : okCount === results.length
        ? `All ${results.length} changes were applied successfully.`
        : `${okCount} of ${results.length} changes applied; ${results.length - okCount} failed. See the results below.`;

  return ok({ results, summary });
}

export async function discardPlan(userId: string, planId: string): Promise<Result<void>> {
  const plan = await getPlan(userId, planId);
  if (!plan.success) return plan;
  if (!plan.data) return fail("Plan not found.");
  if (plan.data.status !== "draft") {
    return fail(`Plan is ${plan.data.status} — it cannot be discarded.`);
  }
  const result = await updatePlan(userId, planId, { status: "discarded" });
  if (!result.success) return fail(result.error);
  return ok(undefined);
}

export async function loadDraftEnvelope(userId: string): Promise<Result<PlanEnvelope | null>> {
  const draft = await getDraftPlan(userId);
  if (!draft.success) return draft;
  if (!draft.data) return ok(null);
  return ok(envelopeOf(draft.data));
}

/** Returns the envelope for a specific plan, or null when missing/not owned. */
export async function getPlanEnvelopeOrNull(
  userId: string,
  planId: string,
): Promise<PlanEnvelope | null> {
  const plan = await getPlan(userId, planId);
  if (!plan.success || !plan.data) return null;
  if (plan.data.status !== "draft") return null;
  return envelopeOf(plan.data);
}

export function isExpired(plan: PlanRow): boolean {
  return new Date(plan.expires_at).getTime() < Date.now();
}

export function toPlanActionPreview(plan: PlanRow): PlanActionPreview[] {
  return plan.previews;
}

export { expireStalePlans };
