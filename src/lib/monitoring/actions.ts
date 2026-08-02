"use server";

/**
 * Monitoring / domain configuration (server-only).
 *
 * - saveMonitoringConfigAction: persists the admin-editable site URL,
 *   health/backup endpoint overrides and failure webhooks.
 * - fireMonitoringWebhooks: notifies enabled webhooks when /api/health or
 *   /api/backup reports a failure.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveSettings } from "@/lib/settings/repository";
import { fail, ok, type Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { monitoringConfigSchema } from "@/lib/validation";
import { getMonitoringConfig } from "@/lib/site/urls";
import type { MonitoringConfig } from "@/types/settings";

export type MonitoringEventType = "health" | "backup";

interface WebhookPayload {
  event: MonitoringEventType;
  ok: boolean;
  detail: string;
  timestamp: string;
  source: string;
  latencyMs?: number | null;
}

/**
 * POSTs the failure payload to every enabled webhook (best-effort,
 * non-blocking, fire-and-forget with a short timeout). Never throws.
 */
export async function fireMonitoringWebhooks(
  event: MonitoringEventType,
  payload: Omit<WebhookPayload, "event" | "ok" | "timestamp">,
): Promise<void> {
  let config: MonitoringConfig;
  try {
    config = await getMonitoringConfig();
  } catch (err) {
    logError("monitoring webhooks: config read failed", {
      message: err instanceof Error ? err.message : err,
    });
    return;
  }
  const enabled = config.webhooks.filter((w) => w.enabled && w.url.startsWith("http"));
  if (enabled.length === 0) return;

  const body: WebhookPayload = {
    event,
    ok: false,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  await Promise.allSettled(
    enabled.map(async (webhook) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "itsazhar-portfolio-monitor",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          logError("monitoring webhook non-200", {
            webhook: webhook.name,
            status: res.status,
            event,
          });
        }
      } catch (err) {
        logError("monitoring webhook failed", {
          webhook: webhook.name,
          message: err instanceof Error ? err.message : err,
          event,
        });
      }
    }),
  );
}

/** Persists the admin-edited monitoring/domain configuration. */
export async function saveMonitoringConfigAction(
  input: Record<string, unknown>,
): Promise<Result<MonitoringConfig>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = monitoringConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await saveSettings({ monitoring_config: parsed.data });
    if (!result.success) return fail(result.error);
    revalidatePath("/admin/keepalive");
    revalidatePath("/admin");
    return ok(parsed.data);
  } catch (err) {
    logError("saveMonitoringConfigAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save monitoring settings");
  }
}

/** Reads the current monitoring config (admin, best-effort). */
export async function getMonitoringConfigAction(): Promise<Result<MonitoringConfig>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const config = await getMonitoringConfig();
    return ok(config);
  } catch (err) {
    logError("getMonitoringConfigAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to load monitoring settings");
  }
}
