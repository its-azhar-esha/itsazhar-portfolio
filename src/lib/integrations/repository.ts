/**
 * Integration settings repository (server-only).
 *
 * Manages external API integrations (AI providers) from the admin panel.
 * Secrets are stored AES-256-GCM encrypted in `integration_settings.config`
 * and resolved here at runtime — never in client bundles, never in logs.
 *
 * Resolution order for an API key: stored secret (admin-managed, preferred)
 * -> existing env var (GROQ_API_KEY / OPENROUTER_API_KEY) as fallback.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { ok, fail, type Result } from "@/lib/result";
import { env } from "@/lib/env";
import type { Database } from "@/database.types";

export const INTEGRATION_IDS = ["groq", "openrouter"] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export interface IntegrationCatalogEntry {
  id: IntegrationId;
  label: string;
  description: string;
  keyLabel: string;
  envConfigured: boolean;
}

export interface IntegrationInfo extends IntegrationCatalogEntry {
  hasStoredKey: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  rotatedAt: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
}

const CATALOG: Record<IntegrationId, Omit<IntegrationCatalogEntry, "envConfigured">> = {
  groq: {
    id: "groq",
    label: "Groq",
    description: "Fast LLM inference powering the AI chat.",
    keyLabel: "GROQ_API_KEY",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    description: "Multi-model fallback for the AI chat.",
    keyLabel: "OPENROUTER_API_KEY",
  },
};

function isConfiguredViaEnv(id: IntegrationId): boolean {
  return id === "groq" ? env.hasGroq : env.hasOpenRouter;
}

export function getIntegrationCatalog(): IntegrationCatalogEntry[] {
  return INTEGRATION_IDS.map((id) => ({
    ...CATALOG[id],
    envConfigured: isConfiguredViaEnv(id),
  }));
}

/** Decrypts and returns the stored secret for an integration, if any. */
export async function getStoredSecret(id: IntegrationId): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("integration_settings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const config = (data as { config?: { secret?: unknown } }).config;
    const raw = config?.secret;
    if (typeof raw !== "string" || raw === "") return null;
    return decryptSecret(raw);
  } catch (err) {
    console.error("[integrations] getStoredSecret failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getIntegrationList(): Promise<Result<IntegrationInfo[]>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("integration_settings").select("*");
    if (error) return fail(error.message);

    type IntegrationRow = Database["public"]["Tables"]["integration_settings"]["Row"];
    const rows = new Map(((data ?? []) as IntegrationRow[]).map((row) => [row.id, row]));
    const list: IntegrationInfo[] = INTEGRATION_IDS.map((id) => {
      const row = rows.get(id);
      const config = (row?.config ?? {}) as { secret?: unknown };
      return {
        ...CATALOG[id],
        envConfigured: isConfiguredViaEnv(id),
        hasStoredKey: typeof config.secret === "string" && config.secret !== "",
        usageCount: row?.usage_count ?? 0,
        lastUsedAt: row?.last_used_at ?? null,
        rotatedAt: row?.rotated_at ?? null,
        expiresAt: row?.expires_at ?? null,
        updatedAt: row?.updated_at ?? null,
      };
    });
    return ok(list);
  } catch (err) {
    console.error("[integrations] getIntegrationList failed:", err instanceof Error ? err.message : err);
    return fail(err instanceof Error ? err.message : "Failed to load integrations");
  }
}

export async function upsertIntegrationSecret(
  id: IntegrationId,
  secret: string,
  expiresAt?: string | null,
): Promise<Result<void>> {
  try {
    const admin = createAdminClient();
    const encrypted = encryptSecret(secret);
    const now = new Date().toISOString();
    const { error } = await admin.from("integration_settings").upsert(
      {
        id,
        label: CATALOG[id].label,
        status: "configured",
        config: { secret: encrypted },
        expires_at: expiresAt || null,
        rotated_at: now,
        updated_at: now,
      } as never,
      { onConflict: "id" },
    );
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    console.error("[integrations] upsertIntegrationSecret failed:", err instanceof Error ? err.message : err);
    return fail(err instanceof Error ? err.message : "Failed to save integration key");
  }
}

export async function clearIntegrationSecret(id: IntegrationId): Promise<Result<void>> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("integration_settings").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    console.error("[integrations] clearIntegrationSecret failed:", err instanceof Error ? err.message : err);
    return fail(err instanceof Error ? err.message : "Failed to remove integration key");
  }
}

async function touchUsage(id: IntegrationId): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("integration_settings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) return;
    type UsageRow = Pick<Database["public"]["Tables"]["integration_settings"]["Row"], "usage_count">;
    const usage = (data as UsageRow).usage_count;
    await admin
      .from("integration_settings")
      .update({
        usage_count: (usage ?? 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
  } catch {
    // Usage tracking is best-effort.
  }
}

/**
 * Resolves the active API key for an integration: stored secret first,
 * env var fallback. Tracks usage when an integration is actually used.
 */
export async function resolveApiKey(id: IntegrationId): Promise<string | null> {
  const stored = await getStoredSecret(id);
  if (stored) {
    await touchUsage(id);
    return stored;
  }
  const envKey = id === "groq" ? env.groqApiKey : env.openrouterApiKey;
  if (envKey) {
    await touchUsage(id);
    return envKey;
  }
  return null;
}
