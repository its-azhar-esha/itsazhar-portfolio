/**
 * Notification sender (server-only).
 *
 * The single dispatch point for every notification in the app. Callers
 * just say `await notify("lead.created", { fields: { ... } })`; the sender
 * handles gating (master -> category -> event -> recipients), token
 * resolution (encrypted stored secret, then env fallback), formatting,
 * delivery and ledger recording.
 *
 * Deliberately fire-and-forget best-effort: it NEVER throws and NEVER
 * blocks the caller's control flow. If the channel is misconfigured the
 * event is simply dropped (and logged to the delivery ledger where
 * possible). This mirrors fireMonitoringWebhooks.
 */

import { NOTIFICATION_PRIORITY_META } from "@/types/notifications";
import { getEventDef, eventCategory, resolveEventPriority } from "./events";
import { getNotificationConfig, insertDelivery } from "./repository";
import { resolveApiKey } from "@/lib/integrations/repository";
import { sendTelegramMessage, testTelegramToken } from "./telegram";
import { formatDateTimeBD } from "@/lib/format/dates";

export interface NotifyFields {
  [key: string]: string | number | boolean | null | undefined;
}

export interface NotifyOptions {
  /** One-line human summary (overrides the registry label when provided). */
  title?: string;
  /** Optional detail line shown under the title. */
  description?: string;
  /** Structured key/value detail lines shown in the message body. */
  fields?: NotifyFields;
  /** Unlisted event ids (tests, ad-hoc alerts) still get sent when true. */
  allowUnregistered?: boolean;
}

function truncate(value: unknown, max = 400): string {
  const text = value === null || value === undefined ? "" : String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function fieldLabel(key: string): string {
  // humanize snake_case / camelCase labels
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMessage(input: {
  eventId: string;
  title: string;
  priority: string;
  description?: string;
  fields?: NotifyFields;
  includeTimestamp: boolean;
}): string {
  const meta =
    NOTIFICATION_PRIORITY_META[input.priority as keyof typeof NOTIFICATION_PRIORITY_META] ??
    NOTIFICATION_PRIORITY_META.normal;
  const lines: string[] = [];
  lines.push(`${meta.emoji} [${meta.label.toUpperCase()}] ${input.title}`);
  if (input.includeTimestamp) {
    lines.push(`⏰ ${formatDateTimeBD(new Date())} (GMT+6)`);
  }
  lines.push(`Event: ${input.eventId}`);
  if (input.description && input.description.trim() !== "") {
    lines.push("");
    lines.push(input.description.trim());
  }
  const detail: string[] = [];
  if (input.fields) {
    for (const [key, value] of Object.entries(input.fields)) {
      const text = truncate(value);
      if (text === "") continue;
      detail.push(`• ${fieldLabel(key)}: ${text}`);
    }
  }
  if (detail.length > 0) {
    lines.push("");
    lines.push(...detail);
  }
  return lines.join("\n");
}

export interface NotifyOutcome {
  eventId: string;
  attempted: number;
  sent: number;
  failed: number;
  skipped: boolean;
  reason: string | null;
}

/**
 * Sends a notification for an event, respecting every config gate.
 * Best-effort: never throws. Records one ledger row per recipient.
 */
export async function notify(eventId: string, options: NotifyOptions = {}): Promise<NotifyOutcome> {
  const outcome: NotifyOutcome = {
    eventId,
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: false,
    reason: null,
  };

  const event = getEventDef(eventId);
  if (!event && !options.allowUnregistered) {
    outcome.skipped = true;
    outcome.reason = "unregistered event";
    return outcome;
  }

  try {
    const config = await getNotificationConfig();

    // Master switch.
    if (!config.enabled) {
      outcome.skipped = true;
      outcome.reason = "notifications disabled";
      return outcome;
    }

    const category = event ? event.category : eventCategory(eventId);

    // Category gate.
    if (!config.categories[category]) {
      outcome.skipped = true;
      outcome.reason = `category "${category}" disabled`;
      return outcome;
    }

    // Event gate (explicitly disabled events; unknown events default on).
    if (event && config.events[eventId] === false) {
      outcome.skipped = true;
      outcome.reason = `event "${eventId}" disabled`;
      return outcome;
    }

    const recipients = config.recipients.filter((recipient) => recipient.enabled);
    if (recipients.length === 0) {
      outcome.skipped = true;
      outcome.reason = "no enabled recipients";
      return outcome;
    }

    const priority = resolveEventPriority(eventId, config.priorities);
    const title = options.title ?? event?.label ?? eventId;
    const message = buildMessage({
      eventId,
      title,
      priority,
      description: options.description,
      fields: options.fields,
      includeTimestamp: true,
    });

    const token = await resolveApiKey("telegram");
    if (!token) {
      outcome.skipped = true;
      outcome.reason = "telegram token not configured";
      // Record the skipped delivery so admins can see why nothing went out.
      for (const recipient of recipients) {
        await insertDelivery({
          event: eventId,
          category,
          priority,
          title,
          message,
          channel: "telegram",
          chatId: recipient.chatId,
          recipientLabel: recipient.label,
          status: "failed",
          error: "Telegram bot token not configured",
          attempts: 1,
        }).catch(() => {});
      }
      return outcome;
    }

    outcome.attempted = recipients.length;
    for (const recipient of recipients) {
      const result = await sendTelegramMessage(token, recipient.chatId, message);
      const failed = !result.ok;
      await insertDelivery({
        event: eventId,
        category,
        priority,
        title,
        message,
        channel: "telegram",
        chatId: recipient.chatId,
        recipientLabel: recipient.label,
        status: failed ? "failed" : "sent",
        error: failed ? (result.error ?? "Send failed") : null,
        attempts: 1,
      }).catch(() => {});
      if (failed) outcome.failed += 1;
      else outcome.sent += 1;
    }
    return outcome;
  } catch (err) {
    console.error(
      `[notifications] notify("${eventId}") failed:`,
      err instanceof Error ? err.message : err,
    );
    outcome.skipped = true;
    outcome.reason = err instanceof Error ? err.message : "internal error";
    return outcome;
  }
}

/** Verifies the configured Telegram bot token and returns bot identity. */
export async function checkTelegramConnection(): Promise<{
  connected: boolean;
  me?: { id: number; username: string | null; firstName: string | null };
  error?: string;
}> {
  const token = await resolveApiKey("telegram");
  if (!token) {
    return { connected: false, error: "No Telegram bot token configured." };
  }
  const result = await testTelegramToken(token);
  if (!result.ok) return { connected: false, error: result.error };
  return { connected: true, me: result.me };
}
