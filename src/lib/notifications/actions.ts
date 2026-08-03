"use server";

/**
 * Notification system admin actions (server-only).
 *
 * - saveNotificationConfigAction: persists toggles, priorities, recipients.
 * - testTelegramConnectionAction: verifies the bot token (stored or env).
 * - saveTelegramTokenAction: stores the bot token encrypted.
 * - clearTelegramTokenAction: removes the stored token (env fallback stays).
 * - sendTestMessageAction: pushes a test message to chosen recipients.
 * - getNotificationOverviewAction: config + connection + recent history.
 * - retryDeliveryAction: re-sends a failed delivery to its recipient.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { logAudit } from "@/lib/audit";
import {
  saveNotificationConfigInputSchema,
  testTelegramInputSchema,
  sendTestMessageInputSchema,
  retryDeliveryInputSchema,
} from "@/lib/validation";
import {
  getNotificationConfig,
  saveNotificationConfig,
  getDeliveryHistory,
  getDeliveryById,
  updateDeliveryResult,
} from "./repository";
import { checkTelegramConnection, notify } from "./sender";
import { sendTelegramMessage, testTelegramToken } from "./telegram";
import {
  upsertIntegrationSecret,
  clearIntegrationSecret,
  resolveApiKey,
} from "@/lib/integrations/repository";
import type { NotificationConfig, NotificationDelivery } from "@/types/notifications";

export interface NotificationOverview {
  config: NotificationConfig;
  telegramConnected: boolean;
  telegramMe?: { id: number; username: string | null; firstName: string | null } | null;
  telegramError?: string | null;
  tokenStored: boolean;
  recentDeliveries: NotificationDelivery[];
}

export async function saveNotificationConfigAction(
  input: Record<string, unknown>,
): Promise<Result<NotificationConfig>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = saveNotificationConfigInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await saveNotificationConfig(parsed.data);
    if (!result.success) return fail(result.error);

    await logAudit({
      action: "notifications.config.updated",
      entity: "site_settings",
      detail: {
        enabled: parsed.data.enabled,
        recipients: parsed.data.recipients.length,
      },
    });
    revalidatePath("/admin/notifications");
    revalidatePath("/admin");
    return ok(parsed.data);
  } catch (err) {
    logError("saveNotificationConfigAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save notification settings");
  }
}

export async function getNotificationOverviewAction(): Promise<Result<NotificationOverview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const [config, connection, recentDeliveries] = await Promise.all([
      getNotificationConfig(),
      checkTelegramConnection(),
      getDeliveryHistory(30),
    ]);

    return ok({
      config,
      telegramConnected: connection.connected,
      telegramMe: connection.me ?? null,
      telegramError: connection.error ?? null,
      tokenStored: (await getTokenStored()) as boolean,
      recentDeliveries,
    });
  } catch (err) {
    logError("getNotificationOverviewAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to load notification settings");
  }
}

async function getTokenStored(): Promise<boolean> {
  try {
    const { getStoredSecret } = await import("@/lib/integrations/repository");
    const secret = await getStoredSecret("telegram");
    return secret !== null;
  } catch {
    return false;
  }
}

export async function testTelegramConnectionAction(): Promise<
  Result<{
    connected: boolean;
    me?: { id: number; username: string | null; firstName: string | null };
  }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const connection = await checkTelegramConnection();
    if (!connection.connected) return fail(connection.error ?? "Connection failed.");
    return ok({ connected: true, me: connection.me });
  } catch (err) {
    logError("testTelegramConnectionAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Connection test failed");
  }
}

export async function saveTelegramTokenAction(
  input: Record<string, unknown>,
): Promise<
  Result<{
    connected: boolean;
    me?: { id: number; username: string | null; firstName: string | null };
  }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = testTelegramInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    // Verify before persisting.
    const check = await testTelegramToken(parsed.data.token);
    if (!check.ok || !check.me) {
      return fail(check.error ?? "Token verification failed — is the bot token correct?");
    }

    const saved = await upsertIntegrationSecret("telegram", parsed.data.token);
    if (!saved.success) return fail(saved.error);

    await logAudit({
      action: "notifications.telegram.token.saved",
      entity: "integration_settings",
      detail: { botUsername: check.me.username ?? null },
    });

    await notify("notification.connected", {
      title: "Telegram connected",
      description: `Bot @${check.me.username ?? check.me.id} is now connected to the notification system.`,
    }).catch(() => {});

    revalidatePath("/admin/notifications");
    revalidatePath("/admin/integrations");
    return ok({ connected: true, me: check.me });
  } catch (err) {
    logError("saveTelegramTokenAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save bot token");
  }
}

export async function clearTelegramTokenAction(): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await clearIntegrationSecret("telegram");
    if (!result.success) return fail(result.error);

    await logAudit({
      action: "notifications.telegram.token.cleared",
      entity: "integration_settings",
    });
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/integrations");
    return ok(undefined);
  } catch (err) {
    logError("clearTelegramTokenAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to clear bot token");
  }
}

export async function sendTestMessageAction(
  input: Record<string, unknown>,
): Promise<Result<{ sent: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = sendTestMessageInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const config = await getNotificationConfig();
    const recipients = config.recipients.filter(
      (r) => parsed.data.recipientIds.includes(r.id) && r.enabled,
    );
    if (recipients.length === 0) {
      return fail("No enabled recipients matched — enable a recipient first.");
    }

    const token = await resolveTelegramToken();
    if (!token) return fail("No Telegram bot token configured.");

    let sent = 0;
    for (const recipient of recipients) {
      const text = [
        "✅ [TEST] Notification test message",
        `⏰ ${new Date().toLocaleString()}`,
        "",
        "If you can read this, Telegram notifications are working for your site.",
      ].join("\n");
      const result = await sendTelegramMessage(token, recipient.chatId, text);
      if (result.ok) sent += 1;
    }

    await logAudit({
      action: "notifications.test.sent",
      entity: "telegram",
      detail: { recipients: parsed.data.recipientIds.length, sent },
    });
    return ok({ sent });
  } catch (err) {
    logError("sendTestMessageAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to send test message");
  }
}

export async function retryDeliveryAction(
  input: Record<string, unknown>,
): Promise<Result<NotificationDelivery>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = retryDeliveryInputSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const delivery = await getDeliveryById(parsed.data.deliveryId);
    if (!delivery) return fail("Delivery not found.");

    const token = await resolveTelegramToken();
    if (!token) return fail("No Telegram bot token configured.");

    const nextAttempts = (delivery.attempts ?? 0) + 1;
    const result = await sendTelegramMessage(token, delivery.chatId, delivery.message);
    const status = result.ok ? "sent" : "failed";

    await updateDeliveryResult(delivery.id, {
      status,
      error: result.ok ? null : (result.error ?? "Send failed"),
      attempts: nextAttempts,
    });

    await logAudit({
      action: "notifications.delivery.retried",
      entity: "notification_deliveries",
      entityId: delivery.id,
      detail: { status },
    });

    const updated = await getDeliveryById(delivery.id);
    if (!updated) return fail("Delivery not found after retry.");
    return ok(updated);
  } catch (err) {
    logError("retryDeliveryAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to retry delivery");
  }
}

async function resolveTelegramToken(): Promise<string | null> {
  return resolveApiKey("telegram");
}
