/**
 * Notification repository (server-only).
 *
 * Reads the admin-managed notification config and records delivery
 * history. Uses the service-role client because `notification_deliveries`
 * is deliberately service-role-only (RLS enabled, zero policies), matching
 * the health_checks / backups / audit_log model.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ok, fail, type Result } from "@/lib/result";
import {
  DEFAULT_NOTIFICATION_CONFIG,
  normalizeNotificationConfig,
  type NotificationConfig,
  type NotificationDelivery,
} from "@/types/notifications";
import { SETTINGS_ROW_ID } from "@/types/settings";

type DeliveryRow = {
  id: string;
  event: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  channel: string;
  chat_id: string;
  recipient_label: string;
  status: string;
  error: string | null;
  attempts: number;
  created_at: string;
  delivered_at: string | null;
};

function toDelivery(row: DeliveryRow): NotificationDelivery {
  return {
    id: row.id,
    event: row.event,
    category: row.category,
    priority: row.priority as NotificationDelivery["priority"],
    title: row.title,
    message: row.message,
    channel: row.channel,
    chatId: row.chat_id,
    recipientLabel: row.recipient_label,
    status: row.status === "failed" ? "failed" : "sent",
    error: row.error,
    attempts: row.attempts,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
  };
}

/**
 * Loads the effective notification config. When the column is missing
 * (migration not yet applied) or the settings row is absent, returns the
 * default (all notifications disabled, no recipients) so senders are safe
 * no-ops.
 */
export async function getNotificationConfig(): Promise<NotificationConfig> {
  try {
    const admin = createAdminClient();
    const { data } = (await admin
      .from("site_settings")
      .select("notification_config")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle()) as unknown as { data: { notification_config?: unknown } | null };
    if (!data) return DEFAULT_NOTIFICATION_CONFIG;
    return normalizeNotificationConfig(data.notification_config);
  } catch (err) {
    console.error(
      "[notifications] getNotificationConfig failed:",
      err instanceof Error ? err.message : err,
    );
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export async function saveNotificationConfig(config: NotificationConfig): Promise<Result<void>> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("site_settings")
      .update({ notification_config: config } as never)
      .eq("id", SETTINGS_ROW_ID);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    console.error(
      "[notifications] saveNotificationConfig failed:",
      err instanceof Error ? err.message : err,
    );
    return fail(err instanceof Error ? err.message : "Failed to save notification settings");
  }
}

export interface NewDelivery {
  event: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  channel: string;
  chatId: string;
  recipientLabel: string;
  status: "sent" | "failed";
  error: string | null;
  attempts: number;
}

export async function insertDelivery(delivery: NewDelivery): Promise<Result<string>> {
  try {
    const admin = createAdminClient();
    const { data, error } = (await admin
      .from("notification_deliveries")
      .insert({
        event: delivery.event,
        category: delivery.category,
        priority: delivery.priority,
        title: delivery.title,
        message: delivery.message,
        channel: delivery.channel,
        chat_id: delivery.chatId,
        recipient_label: delivery.recipientLabel,
        status: delivery.status,
        error: delivery.error,
        attempts: delivery.attempts,
        delivered_at: delivery.status === "sent" ? new Date().toISOString() : null,
      } as never)
      .select("id")
      .single()) as unknown as { data: { id: string } | null; error: { message: string } | null };
    if (error || !data) return fail(error?.message ?? "Failed to record delivery");
    return ok(data.id);
  } catch (err) {
    console.error(
      "[notifications] insertDelivery failed:",
      err instanceof Error ? err.message : err,
    );
    return fail(err instanceof Error ? err.message : "Failed to record delivery");
  }
}

export async function getDeliveryHistory(limit = 50): Promise<NotificationDelivery[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notification_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as DeliveryRow[]).map(toDelivery);
  } catch (err) {
    console.error(
      "[notifications] getDeliveryHistory failed:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function getDeliveryById(id: string): Promise<NotificationDelivery | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notification_deliveries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toDelivery(data as DeliveryRow);
  } catch {
    return null;
  }
}

export async function updateDeliveryResult(
  id: string,
  update: { status: "sent" | "failed"; error: string | null; attempts: number },
): Promise<Result<void>> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("notification_deliveries")
      .update({
        status: update.status,
        error: update.error,
        attempts: update.attempts,
        delivered_at: update.status === "sent" ? new Date().toISOString() : null,
      } as never)
      .eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    console.error(
      "[notifications] updateDeliveryResult failed:",
      err instanceof Error ? err.message : err,
    );
    return fail(err instanceof Error ? err.message : "Failed to update delivery");
  }
}
