/**
 * Notification system types (server + admin UI).
 *
 * The notification config (master switch, category/event toggles,
 * priority overrides, recipients) is stored non-secret in
 * `site_settings.notification_config` (JSONB). The Telegram bot token is
 * a secret and is stored separately, AES-256-GCM encrypted, via the
 * integration_settings table (see `src/lib/integrations`); it is never
 * part of this config and never reaches the client.
 */

export type NotificationCategory = "leads" | "content" | "monitoring" | "system" | "security";

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface NotificationRecipient {
  id: string;
  /** Telegram chat id (numeric user/group/supergroup id, or @handle). */
  chatId: string;
  label: string;
  enabled: boolean;
}

export interface NotificationConfig {
  /** Master switch — when false, nothing is sent anywhere. */
  enabled: boolean;
  /** categoryId -> enabled (default: all enabled). */
  categories: Record<NotificationCategory, boolean>;
  /** eventId -> enabled (default: all enabled). */
  events: Record<string, boolean>;
  /** eventId -> priority override (defaults come from the event registry). */
  priorities: Record<string, NotificationPriority>;
  /** Recipients (chat ids) to send to. */
  recipients: NotificationRecipient[];
}

export interface NotificationEventDef {
  id: string;
  category: NotificationCategory;
  /** Human-readable event name (also used as the message title). */
  label: string;
  /** One-line description shown in the admin panel. */
  description: string;
  defaultPriority: NotificationPriority;
}

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; description: string }
> = {
  leads: {
    label: "Leads",
    description: "New client inquiries — highest priority.",
  },
  content: {
    label: "Content activity",
    description: "CMS changes: projects, blog, services, media, SEO, settings.",
  },
  monitoring: {
    label: "Monitoring & jobs",
    description: "Keep-alive, health checks, backups, scheduled job results.",
  },
  system: {
    label: "System",
    description: "Integration keys, configuration changes, provider failures.",
  },
  security: {
    label: "Security",
    description: "Admin sign-ins and authentication-related events.",
  },
};

export const NOTIFICATION_PRIORITY_META: Record<
  NotificationPriority,
  { label: string; emoji: string; rank: number }
> = {
  critical: { label: "Critical", emoji: "🚨", rank: 4 },
  high: { label: "High", emoji: "⚠️", rank: 3 },
  normal: { label: "Normal", emoji: "ℹ️", rank: 2 },
  low: { label: "Low", emoji: "🔵", rank: 1 },
};

export interface NotificationDelivery {
  id: string;
  event: string;
  category: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  channel: string;
  chatId: string;
  recipientLabel: string;
  status: "sent" | "failed";
  error: string | null;
  attempts: number;
  createdAt: string;
  deliveredAt: string | null;
}

export const DEFAULT_NOTIFICATION_RECIPIENTS: NotificationRecipient[] = [];

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: false,
  categories: {
    leads: true,
    content: true,
    monitoring: true,
    system: true,
    security: true,
  },
  events: {},
  priorities: {},
  recipients: DEFAULT_NOTIFICATION_RECIPIENTS,
};

function isPriority(value: unknown): value is NotificationPriority {
  return value === "critical" || value === "high" || value === "normal" || value === "low";
}

/** Coerce a stored notification_config value into a clean NotificationConfig. */
export function normalizeNotificationConfig(value: unknown): NotificationConfig {
  if (typeof value !== "object" || value === null) return DEFAULT_NOTIFICATION_CONFIG;
  const candidate = value as Record<string, unknown>;

  const categories: Record<NotificationCategory, boolean> = {
    ...DEFAULT_NOTIFICATION_CONFIG.categories,
  };
  if (typeof candidate.categories === "object" && candidate.categories !== null) {
    const raw = candidate.categories as Record<string, unknown>;
    (Object.keys(categories) as NotificationCategory[]).forEach((key) => {
      if (typeof raw[key] === "boolean") categories[key] = raw[key];
    });
  }

  const events: Record<string, boolean> = {};
  if (typeof candidate.events === "object" && candidate.events !== null) {
    const raw = candidate.events as Record<string, unknown>;
    for (const [key, val] of Object.entries(raw)) {
      if (typeof key === "string" && key !== "" && typeof val === "boolean") events[key] = val;
    }
  }

  const priorities: Record<string, NotificationPriority> = {};
  if (typeof candidate.priorities === "object" && candidate.priorities !== null) {
    const raw = candidate.priorities as Record<string, unknown>;
    for (const [key, val] of Object.entries(raw)) {
      if (typeof key === "string" && key !== "" && isPriority(val)) priorities[key] = val;
    }
  }

  const recipients: NotificationRecipient[] = [];
  if (Array.isArray(candidate.recipients)) {
    for (const entry of candidate.recipients) {
      if (typeof entry !== "object" || entry === null) continue;
      const rec = entry as Record<string, unknown>;
      if (typeof rec.chatId !== "string" || rec.chatId.trim() === "") continue;
      recipients.push({
        id: typeof rec.id === "string" && rec.id !== "" ? rec.id : crypto.randomUUID(),
        chatId: rec.chatId.trim().slice(0, 120),
        label:
          typeof rec.label === "string" && rec.label.trim() !== ""
            ? rec.label.trim().slice(0, 60)
            : rec.chatId.trim().slice(0, 60),
        enabled: rec.enabled !== false,
      });
    }
  }

  return {
    enabled: candidate.enabled !== false,
    categories,
    events,
    priorities,
    recipients,
  };
}
