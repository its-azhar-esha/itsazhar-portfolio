import type {
  NotificationCategory,
  NotificationEventDef,
  NotificationPriority,
} from "@/types/notifications";

/**
 * Central registry of every notifiable event. Adding a new event is a
 * one-line, declarative change here; the sender and admin UI pick it up
 * automatically.
 */

export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  // ── Leads ──────────────────────────────────────────────────────────────
  {
    id: "lead.created",
    category: "leads",
    label: "New lead received",
    description: "A new client inquiry was submitted through the public site.",
    defaultPriority: "critical",
  },

  // ── Content activity ──────────────────────────────────────────────────
  {
    id: "project.created",
    category: "content",
    label: "Project created",
    description: "A project was added to the portfolio.",
    defaultPriority: "normal",
  },
  {
    id: "project.updated",
    category: "content",
    label: "Project updated",
    description: "An existing project was edited.",
    defaultPriority: "low",
  },
  {
    id: "project.deleted",
    category: "content",
    label: "Project deleted",
    description: "A project was removed.",
    defaultPriority: "normal",
  },
  {
    id: "project.reordered",
    category: "content",
    label: "Projects reordered",
    description: "The display order of projects was changed.",
    defaultPriority: "low",
  },
  {
    id: "admin.ai.applied",
    category: "content",
    label: "Admin AI plan applied",
    description: "The Admin AI applied an approved change plan to the CMS.",
    defaultPriority: "low",
  },
  {
    id: "blog.created",
    category: "content",
    label: "Blog post created",
    description: "A new blog post was created.",
    defaultPriority: "normal",
  },
  {
    id: "blog.updated",
    category: "content",
    label: "Blog post updated",
    description: "An existing blog post was edited.",
    defaultPriority: "low",
  },
  {
    id: "blog.deleted",
    category: "content",
    label: "Blog post deleted",
    description: "A blog post was removed.",
    defaultPriority: "normal",
  },
  {
    id: "service.created",
    category: "content",
    label: "Service created",
    description: "A new service was added.",
    defaultPriority: "normal",
  },
  {
    id: "service.updated",
    category: "content",
    label: "Service updated",
    description: "An existing service was edited.",
    defaultPriority: "low",
  },
  {
    id: "service.deleted",
    category: "content",
    label: "Service deleted",
    description: "A service was removed.",
    defaultPriority: "normal",
  },
  {
    id: "media.uploaded",
    category: "content",
    label: "Media uploaded",
    description: "A new asset was uploaded to storage.",
    defaultPriority: "low",
  },
  {
    id: "media.updated",
    category: "content",
    label: "Media updated",
    description: "An existing asset was edited.",
    defaultPriority: "low",
  },
  {
    id: "media.deleted",
    category: "content",
    label: "Media deleted",
    description: "An asset was removed from storage.",
    defaultPriority: "normal",
  },
  {
    id: "seo.created",
    category: "content",
    label: "SEO record created",
    description: "A new SEO entry was created.",
    defaultPriority: "low",
  },
  {
    id: "seo.updated",
    category: "content",
    label: "SEO updated",
    description: "An SEO entry was changed.",
    defaultPriority: "low",
  },
  {
    id: "seo.deleted",
    category: "content",
    label: "SEO record deleted",
    description: "An SEO entry was removed.",
    defaultPriority: "normal",
  },
  {
    id: "settings.updated",
    category: "content",
    label: "Settings updated",
    description: "Site settings or configuration were changed.",
    defaultPriority: "low",
  },
  {
    id: "ai.config.updated",
    category: "content",
    label: "AI configuration updated",
    description:
      "The AI assistant configuration (knowledge sources, providers, custom knowledge) was changed.",
    defaultPriority: "low",
  },
  {
    id: "content.updated",
    category: "content",
    label: "Page content updated",
    description: "Hero/about/contact page content was edited.",
    defaultPriority: "low",
  },

  // ── Monitoring & scheduled jobs ───────────────────────────────────────
  {
    id: "health.ok",
    category: "monitoring",
    label: "Health check passed",
    description: "The keep-alive / health check completed successfully.",
    defaultPriority: "low",
  },
  {
    id: "health.failed",
    category: "monitoring",
    label: "Health check failed",
    description: "A scheduled health check reported a failure.",
    defaultPriority: "high",
  },
  {
    id: "backup.ok",
    category: "monitoring",
    label: "Backup completed",
    description: "The scheduled nightly backup finished successfully.",
    defaultPriority: "low",
  },
  {
    id: "backup.partial",
    category: "monitoring",
    label: "Backup partially failed",
    description: "Some parts of the backup did not complete.",
    defaultPriority: "high",
  },
  {
    id: "backup.failed",
    category: "monitoring",
    label: "Backup failed",
    description: "The scheduled backup reported an error.",
    defaultPriority: "critical",
  },
  {
    id: "job.started",
    category: "monitoring",
    label: "Scheduled job started",
    description: "A scheduled job (cron) began execution.",
    defaultPriority: "low",
  },
  {
    id: "job.failed",
    category: "monitoring",
    label: "Scheduled job failed",
    description: "A scheduled job threw an error.",
    defaultPriority: "high",
  },

  // ── System / integrations ─────────────────────────────────────────────
  {
    id: "cleanup.completed",
    category: "system",
    label: "Storage cleanup completed",
    description: "A storage/cleanup run finished and removed items.",
    defaultPriority: "low",
  },
  {
    id: "integration.key.saved",
    category: "system",
    label: "Integration key saved",
    description: "A provider API key was configured or replaced.",
    defaultPriority: "normal",
  },
  {
    id: "integration.key.cleared",
    category: "system",
    label: "Integration key cleared",
    description: "A provider API key was removed.",
    defaultPriority: "normal",
  },
  {
    id: "integration.failure",
    category: "system",
    label: "Integration failure",
    description: "A provider integration reported an error.",
    defaultPriority: "high",
  },
  {
    id: "notification.connected",
    category: "system",
    label: "Notification channel connected",
    description: "The Telegram connection was tested successfully.",
    defaultPriority: "low",
  },

  // ── Security / auth ───────────────────────────────────────────────────
  {
    id: "auth.signed_in",
    category: "security",
    label: "Admin signed in",
    description: "Someone signed in to the admin panel.",
    defaultPriority: "normal",
  },
];

const EVENT_BY_ID = new Map(NOTIFICATION_EVENTS.map((event) => [event.id, event]));

export function getEventDef(eventId: string): NotificationEventDef | undefined {
  return EVENT_BY_ID.get(eventId);
}

/** Resolve the effective priority for an event (config override wins). */
export function resolveEventPriority(
  eventId: string,
  priorities: Record<string, NotificationPriority>,
): NotificationPriority {
  const configured = priorities[eventId];
  if (configured) return configured;
  return getEventDef(eventId)?.defaultPriority ?? "normal";
}

export function eventCategory(eventId: string): NotificationCategory {
  return getEventDef(eventId)?.category ?? "system";
}
