"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { fail, type Result } from "@/lib/result";
import {
  getIntegrationList,
  upsertIntegrationSecret,
  clearIntegrationSecret,
  type IntegrationId,
  type IntegrationInfo,
} from "./repository";
import { isIntegrationId } from "./catalog";

export async function getIntegrationsAction(): Promise<Result<IntegrationInfo[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return getIntegrationList();
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load integrations");
  }
}

export async function saveIntegrationKeyAction(
  id: IntegrationId,
  secret: string,
  expiresAt?: string | null,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const trimmed = secret.trim();
    if (trimmed.length < 8) return fail("API key looks too short to be valid.");
    if (!isIntegrationId(id)) return fail("Unknown integration.");

    const result = await upsertIntegrationSecret(id, trimmed, expiresAt);
    if (result.success) {
      revalidatePath("/admin/integrations");
      await logAudit({
        action: "integration.key.saved",
        entity: "integration",
        entityId: id,
        detail: { expiresAt: expiresAt || null },
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save integration key");
  }
}

export async function clearIntegrationKeyAction(id: IntegrationId): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    if (!isIntegrationId(id)) return fail("Unknown integration.");

    const result = await clearIntegrationSecret(id);
    if (result.success) {
      revalidatePath("/admin/integrations");
      await logAudit({
        action: "integration.key.cleared",
        entity: "integration",
        entityId: id,
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to remove integration key");
  }
}
