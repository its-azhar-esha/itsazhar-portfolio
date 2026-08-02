/**
 * Effective site/monitoring URLs (server-only).
 *
 * Resolution order for the canonical site URL:
 *   1. monitoring_config.siteUrl   (admin-editable, stored in site_settings)
 *   2. NEXT_PUBLIC_SITE_URL env    (Vercel env var / .env.local)
 *   3. DEFAULT_SITE_URL            (this project's Vercel production alias)
 *
 * Health/backup endpoint URLs resolve from monitoring_config overrides,
 * falling back to the canonical site URL + standard paths. This means
 * switching the public domain later only requires editing the value in the
 * Admin panel — no code or deployment changes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL_DEFAULT } from "@/lib/site";
import { normalizeMonitoringConfig, type MonitoringConfig } from "@/types/settings";

export { SITE_URL_DEFAULT };

function stripTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/** Reads the admin-editable monitoring config (never throws). */
export async function getMonitoringConfig(): Promise<MonitoringConfig> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_settings").select("monitoring_config").maybeSingle();
    return normalizeMonitoringConfig(
      (data as { monitoring_config?: unknown } | null)?.monitoring_config,
    );
  } catch {
    return normalizeMonitoringConfig(undefined);
  }
}

/** Canonical site URL: DB config -> env -> default. */
export async function getSiteUrl(): Promise<string> {
  const config = await getMonitoringConfig();
  if (config.siteUrl) return stripTrailingSlash(config.siteUrl);
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (envUrl) return envUrl;
  return SITE_URL_DEFAULT;
}

/** Keep-alive endpoint URL: override -> canonical + /api/health. */
export async function getHealthCheckUrl(): Promise<string> {
  const config = await getMonitoringConfig();
  if (config.healthCheckUrl) return stripTrailingSlash(config.healthCheckUrl);
  return `${await getSiteUrl()}/api/health`;
}

/** Backup endpoint URL: override -> canonical + /api/backup. */
export async function getBackupUrl(): Promise<string> {
  const config = await getMonitoringConfig();
  if (config.backupUrl) return stripTrailingSlash(config.backupUrl);
  return `${await getSiteUrl()}/api/backup`;
}
