import { DEFAULT_NOTIFICATION_CONFIG, type NotificationConfig } from "@/types/notifications";

export interface NavItemConfig {
  label: string;
  href: string;
  enabled: boolean;
}

export interface AnalyticsConfig {
  enabled: boolean;
  retentionDays: number;
  windowDays: number;
  trackSearchKeywords: boolean;
}

export interface DxConfig {
  recordHealthChecks: boolean;
  linkCheckTimeoutMs: number;
  linkCheckMaxUrls: number;
  seoTitleMax: number;
  seoDescMin: number;
  seoDescMax: number;
}

export interface MonitoringWebhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface MonitoringConfig {
  /** Canonical site URL ("" = derive from NEXT_PUBLIC_SITE_URL / default). */
  siteUrl: string;
  /** Keep-alive endpoint override ("" = derive from siteUrl). */
  healthCheckUrl: string;
  /** Backup endpoint override ("" = derive from siteUrl). */
  backupUrl: string;
  /** Endpoints notified on health/backup failure. */
  webhooks: MonitoringWebhook[];
}

export interface SiteSettings {
  id: string;
  site_name: string;
  site_title: string;
  site_description: string;
  tagline: string;
  logo: string | null;
  location: string;
  contact_email: string;
  contact_phone: string | null;
  booking_url: string | null;
  social_github: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_fiverr: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  footer_text: string;
  maintenance_mode: boolean;
  show_ai_chat: boolean;
  show_hero: boolean;
  show_showcase: boolean;
  show_services: boolean;
  show_case_studies: boolean;
  show_about: boolean;
  show_testimonials: boolean;
  show_contact: boolean;
  show_blog: boolean;
  show_hub: boolean;
  show_playground: boolean;
  featured_projects_enabled: boolean;
  featured_services_enabled: boolean;
  ga4_measurement_id: string | null;
  gtm_id: string | null;
  clarity_project_id: string | null;
  nav_order: NavItemConfig[];
  analytics_config: AnalyticsConfig;
  dx_config: DxConfig;
  monitoring_config: MonitoringConfig;
  notification_config: NotificationConfig;
  created_at: string;
  updated_at: string;
}

export type SiteSettingsInput = Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>;
export const SETTINGS_ROW_ID = "00000000-0000-0000-0000-000000000001";

export const DEFAULT_NAV_ORDER: NavItemConfig[] = [
  { label: "Home", href: "/", enabled: true },
  { label: "Services", href: "/#services", enabled: true },
  { label: "Projects", href: "/projects", enabled: true },
  { label: "About", href: "/about", enabled: true },
  { label: "Contact", href: "/#contact", enabled: true },
  { label: "Blog", href: "/blog", enabled: true },
  { label: "Hub", href: "/hub", enabled: true },
  { label: "Playground", href: "/playground", enabled: true },
];

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  retentionDays: 90,
  windowDays: 30,
  trackSearchKeywords: true,
};

export const DEFAULT_DX_CONFIG: DxConfig = {
  recordHealthChecks: true,
  linkCheckTimeoutMs: 8000,
  linkCheckMaxUrls: 25,
  seoTitleMax: 70,
  seoDescMin: 120,
  seoDescMax: 160,
};

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  siteUrl: "",
  healthCheckUrl: "",
  backupUrl: "",
  webhooks: [],
};

/** Coerce a stored nav_order value into a clean NavItemConfig[]. */
export function normalizeNavOrder(value: unknown): NavItemConfig[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_NAV_ORDER;
  const items: NavItemConfig[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.label === "string" &&
      candidate.label.trim() !== "" &&
      typeof candidate.href === "string" &&
      candidate.href.startsWith("/")
    ) {
      items.push({
        label: candidate.label.trim().slice(0, 24),
        href: candidate.href.slice(0, 120),
        enabled: candidate.enabled !== false,
      });
    }
  }
  return items.length > 0 ? items : DEFAULT_NAV_ORDER;
}

/** Coerce a stored analytics_config value into AnalyticsConfig. */
export function normalizeAnalyticsConfig(value: unknown): AnalyticsConfig {
  if (typeof value !== "object" || value === null) return DEFAULT_ANALYTICS_CONFIG;
  const candidate = value as Record<string, unknown>;
  return {
    enabled: candidate.enabled !== false,
    retentionDays: numberOr(
      candidate.retentionDays,
      DEFAULT_ANALYTICS_CONFIG.retentionDays,
      7,
      365,
    ),
    windowDays: numberOr(candidate.windowDays, DEFAULT_ANALYTICS_CONFIG.windowDays, 7, 90),
    trackSearchKeywords: candidate.trackSearchKeywords !== false,
  };
}

/** Coerce a stored dx_config value into DxConfig. */
export function normalizeDxConfig(value: unknown): DxConfig {
  if (typeof value !== "object" || value === null) return DEFAULT_DX_CONFIG;
  const candidate = value as Record<string, unknown>;
  return {
    recordHealthChecks: candidate.recordHealthChecks !== false,
    linkCheckTimeoutMs: numberOr(candidate.linkCheckTimeoutMs, 8000, 1000, 30000),
    linkCheckMaxUrls: numberOr(candidate.linkCheckMaxUrls, 25, 1, 200),
    seoTitleMax: numberOr(candidate.seoTitleMax, 70, 40, 120),
    seoDescMin: numberOr(candidate.seoDescMin, 120, 60, 300),
    seoDescMax: numberOr(candidate.seoDescMax, 160, 80, 400),
  };
}

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Coerce a stored monitoring_config value into MonitoringConfig. */
export function normalizeMonitoringConfig(value: unknown): MonitoringConfig {
  if (typeof value !== "object" || value === null) return DEFAULT_MONITORING_CONFIG;
  const candidate = value as Record<string, unknown>;
  const siteUrl = typeof candidate.siteUrl === "string" ? candidate.siteUrl.trim() : "";
  const healthCheckUrl =
    typeof candidate.healthCheckUrl === "string" ? candidate.healthCheckUrl.trim() : "";
  const backupUrl = typeof candidate.backupUrl === "string" ? candidate.backupUrl.trim() : "";
  const webhooks: MonitoringWebhook[] = [];
  if (Array.isArray(candidate.webhooks)) {
    for (const entry of candidate.webhooks) {
      if (typeof entry !== "object" || entry === null) continue;
      const hook = entry as Record<string, unknown>;
      if (typeof hook.url !== "string" || hook.url.trim() === "") continue;
      webhooks.push({
        id: typeof hook.id === "string" && hook.id !== "" ? hook.id : crypto.randomUUID(),
        name:
          typeof hook.name === "string" && hook.name.trim() !== ""
            ? hook.name.trim().slice(0, 40)
            : "Webhook",
        url: hook.url.trim().slice(0, 500),
        enabled: hook.enabled !== false,
      });
    }
  }
  return {
    siteUrl: siteUrl.slice(0, 200),
    healthCheckUrl: healthCheckUrl.slice(0, 300),
    backupUrl: backupUrl.slice(0, 300),
    webhooks,
  };
}

export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, "id" | "created_at" | "updated_at"> = {
  site_name: "Azhar",
  site_title: "Azhar",
  site_description:
    "AI Automation Specialist building intelligent agents, workflows and integrations that eliminate repetitive work.",
  tagline: "AI Automation Specialist",
  logo: null,
  location: "Remote, Worldwide",
  contact_email: "azharmahmudalif@gmail.com",
  contact_phone: null,
  booking_url: null,
  social_github: "https://github.com/azharmahmudalif",
  social_linkedin: "https://linkedin.com/in/azharmahmudalif",
  social_twitter: "https://x.com/azhar_m_alif",
  social_fiverr: "https://fiverr.com/azhar_m_alif",
  social_instagram: null,
  social_youtube: null,
  footer_text: "© 2026 Azhar (itsazhar.com). All rights reserved.",
  maintenance_mode: false,
  show_ai_chat: true,
  show_hero: true,
  show_showcase: true,
  show_services: true,
  show_case_studies: true,
  show_about: true,
  show_testimonials: false,
  show_contact: true,
  show_blog: true,
  show_hub: true,
  show_playground: true,
  featured_projects_enabled: true,
  featured_services_enabled: true,
  ga4_measurement_id: null,
  gtm_id: null,
  clarity_project_id: null,
  nav_order: DEFAULT_NAV_ORDER,
  analytics_config: DEFAULT_ANALYTICS_CONFIG,
  dx_config: DEFAULT_DX_CONFIG,
  monitoring_config: DEFAULT_MONITORING_CONFIG,
  notification_config: DEFAULT_NOTIFICATION_CONFIG,
};
