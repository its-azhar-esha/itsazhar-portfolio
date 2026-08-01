/**
 * Integration catalog (server-only registry).
 *
 * Single source of truth for every external service the admin panel can
 * manage. Adding a new integration is one entry here — the repository,
 * actions and UI all derive from this list.
 *
 * Fields:
 * - id: unique slug, also the primary key in `integration_settings`.
 * - envVarName: environment variable used as fallback when no key is
 *   stored in the admin panel.
 * - category: coarse grouping for future UI sections.
 * - icon: key into the client-side icon map; unknown keys fall back to a
 *   generic icon, so new entries never break the UI.
 * - docsUrl: where a key can be obtained (shown in the admin panel).
 * - keyHint: optional prefix used to sanity-check pasted keys (e.g. "gsk_").
 */

export interface IntegrationCatalogEntry {
  id: string;
  label: string;
  description: string;
  keyLabel: string;
  envVarName: string;
  category: "ai" | "other";
  icon: string;
  docsUrl?: string;
  keyHint?: string;
}

export const INTEGRATION_CATALOG = [
  {
    id: "groq",
    label: "Groq",
    description: "Fast LLM inference powering the AI chat.",
    keyLabel: "GROQ_API_KEY",
    envVarName: "GROQ_API_KEY",
    category: "ai",
    icon: "groq",
    docsUrl: "https://console.groq.com/keys",
    keyHint: "gsk_",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Multi-model fallback for the AI chat.",
    keyLabel: "OPENROUTER_API_KEY",
    envVarName: "OPENROUTER_API_KEY",
    category: "ai",
    icon: "openrouter",
    docsUrl: "https://openrouter.ai/settings/keys",
  },
] as const satisfies readonly IntegrationCatalogEntry[];

export type IntegrationId = (typeof INTEGRATION_CATALOG)[number]["id"];

export function isIntegrationId(value: string): value is IntegrationId {
  return INTEGRATION_CATALOG.some((entry) => entry.id === value);
}

export function getCatalogEntry(id: string): IntegrationCatalogEntry | undefined {
  return INTEGRATION_CATALOG.find((entry) => entry.id === id);
}

/** Env var fallback for an integration, read at runtime (server only). */
export function getEnvKey(id: string): string | null {
  const entry = getCatalogEntry(id);
  if (!entry) return null;
  const value = process.env[entry.envVarName];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * Partial key for identification: first 4 + last 4 characters, middle
 * masked. Never exposes the full secret. Keys shorter than 12 characters
 * keep first 2 + last 2.
 */
export function maskKey(secret: string): string {
  if (secret.length <= 8) {
    return `${secret.slice(0, 2)}••••${secret.slice(-2)}`;
  }
  const head = secret.slice(0, 4);
  const tail = secret.slice(-4);
  return `${head}••••••••••${tail}`;
}
