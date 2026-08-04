/**
 * Admin AI tool registry — types.
 *
 * A tool wraps one CMS mutation behind the preview-first protocol: the AI
 * only ever PROPOSES actions; previews are computed from live data and
 * nothing is applied until the owner approves the plan.
 */

import type { Result } from "@/lib/result";

/** Simplified JSON-schema-like declaration the planner LLM reads. */
export interface ToolParamSpec {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  /** Allowed values for string enums. */
  enum?: string[];
  /** Element spec for arrays. */
  items?: ToolParamSpec;
  /** Nested fields for objects. */
  properties?: Record<string, ToolParamSpec>;
}

export interface ToolDefinition {
  /** Stable tool id, e.g. "projects.update". */
  id: string;
  /** Admin section, e.g. "Projects". */
  module: string;
  /** Short human label, e.g. "Update project". */
  label: string;
  /** Instructions for the planner: when to use, what params mean. */
  description: string;
  /** Parameter contract the planner must fill. */
  params: Record<string, ToolParamSpec>;
  /**
   * Loads the CURRENT state referenced by params (for the "before" side of
   * the preview). Must not mutate anything.
   */
  loadCurrent(params: Record<string, unknown>): Promise<unknown>;
  /**
   * Computes the PROPOSED state (for the "after" side). Defaults to the raw
   * params for creates.
   */
  computeProposed?(params: Record<string, unknown>): Promise<unknown>;
  /** Renders the before/after preview lines shown in the plan card. */
  previewText(current: unknown, proposed: unknown): { before: string[]; after: string[] };
  /** Applies the approved action (only called after explicit approval). */
  apply(params: Record<string, unknown>): Promise<Result<{ summary: string }>>;
}

/** One action a plan contains (serialized to admin_ai_plans.actions). */
export interface PlanAction {
  toolId: string;
  params: Record<string, unknown>;
}

/** Rendered preview block attached to each plan action. */
export interface PlanActionPreview {
  toolId: string;
  module: string;
  label: string;
  mutates: boolean;
  before: string[];
  after: string[];
  error: string | null;
}

/** Payload the client receives to render the plan card. */
export interface PlanEnvelope {
  id: string;
  explanation: string;
  actions: PlanActionPreview[];
  expiresAt: string;
}

/** Result of one applied action (approve step). */
export interface PlanActionResult {
  toolId: string;
  label: string;
  ok: boolean;
  message: string;
}
