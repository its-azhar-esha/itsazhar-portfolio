"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { submitLeadSchema, updateLeadStatusSchema } from "@/lib/validation";
import {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  type LeadPage,
  type LeadQuery,
} from "./repository";
import type { Lead, LeadStats } from "@/types/lead";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";

/** Public: captures a lead from the Book a Free Audit form. No auth required. */
export async function submitLeadAction(input: Record<string, unknown>): Promise<Result<Lead>> {
  try {
    const parsed = submitLeadSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }
    return createLead(parsed.data);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to submit lead");
  }
}

export async function getLeadsAction(query: LeadQuery = {}): Promise<Result<LeadPage>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getLeads(query);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list leads");
  }
}

export async function updateLeadStatusAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<Lead>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateLeadStatusSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateLeadStatus(id, parsed.data.status);
    if (result.success) revalidatePath("/admin/leads");
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update lead");
  }
}

export async function deleteLeadAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteLead(id);
    if (result.success) revalidatePath("/admin/leads");
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete lead");
  }
}

export async function getLeadStatsAction(): Promise<Result<LeadStats>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getLeadStats();
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load lead stats");
  }
}
