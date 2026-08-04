/**
 * Runtime AI configuration loader (server-only).
 *
 * Reads `ai_config` + `custom_knowledge` from site_settings using the admin
 * client so the public chat can resolve configuration without a user session.
 * Values are normalized against defaults and cached briefly (mirrors the
 * CMS-knowledge cache in cms-context.ts). Never throws — the AI chat must
 * degrade gracefully when Supabase is unavailable.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  SETTINGS_ROW_ID,
  DEFAULT_AI_CONFIG,
  normalizeAiConfig,
  type AiConfig,
  type AiKnowledgeSources,
} from "@/types/settings";

const CONFIG_TTL_MS = 30_000;

interface ConfigCache {
  at: number;
  config: AiConfig;
  customKnowledge: string;
}

let cache: ConfigCache | null = null;

async function loadAiSettings(): Promise<ConfigCache> {
  const now = Date.now();
  if (cache && now - cache.at < CONFIG_TTL_MS) return cache;

  const next: ConfigCache = {
    at: now,
    config: DEFAULT_AI_CONFIG,
    customKnowledge: "",
  };

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("ai_config, custom_knowledge")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    const row = data as { ai_config?: unknown; custom_knowledge?: unknown } | null;
    if (row) {
      next.config = normalizeAiConfig(row.ai_config);
      next.customKnowledge = typeof row.custom_knowledge === "string" ? row.custom_knowledge : "";
    }
  } catch {
    // Fall back to defaults — the chat stays usable.
  }

  cache = next;
  return cache;
}

export async function getAiConfig(): Promise<AiConfig> {
  const loaded = await loadAiSettings();
  return loaded.config;
}

export async function getCustomKnowledge(): Promise<string> {
  const loaded = await loadAiSettings();
  return loaded.customKnowledge;
}

/** Knowledge-source toggles from the saved config (true = include the source). */
export async function getEnabledKnowledgeSources(): Promise<AiKnowledgeSources> {
  const config = await getAiConfig();
  return config.knowledge;
}

/** Drops the cached config so the next read picks up fresh values. */
export function invalidateAiConfigCache(): void {
  cache = null;
}

/** Ordered, enabled provider chain (priority ascending). */
export async function getProviderChain(): Promise<AiConfig["providers"]> {
  const config = await getAiConfig();
  if (!config.enabled) return [];
  return config.providers.filter((p) => p.enabled).sort((a, b) => a.priority - b.priority);
}
