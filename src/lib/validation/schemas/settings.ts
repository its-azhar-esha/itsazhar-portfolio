import { z } from "zod";
import { mediaUrlOrReferenceSchema } from "./media";

const optionalUrl = z
  .union([z.string().url(), z.string().email(), z.literal("")])
  .nullish()
  .transform((v) => (v && v.trim() !== "" ? v : null));

export const navItemSchema = z.object({
  label: z.string().trim().min(1, "Navigation label is required").max(24),
  href: z
    .string()
    .trim()
    .min(1, "Navigation href is required")
    .max(120)
    .startsWith("/", "Href must start with /"),
  enabled: z.boolean(),
});

export const analyticsConfigSchema = z.object({
  enabled: z.boolean(),
  retentionDays: z.number().int().min(7, "Retention must be at least 7 days").max(365),
  windowDays: z.number().int().min(7, "Window must be at least 7 days").max(90),
  trackSearchKeywords: z.boolean(),
});

export const dxConfigSchema = z.object({
  recordHealthChecks: z.boolean(),
  linkCheckTimeoutMs: z.number().int().min(1000).max(30000),
  linkCheckMaxUrls: z.number().int().min(1).max(200),
  seoTitleMax: z.number().int().min(40).max(120),
  seoDescMin: z.number().int().min(60).max(300),
  seoDescMax: z.number().int().min(80).max(400),
});

const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v),
    "Enter a valid http(s) URL or leave empty",
  )
  .transform((v) => v.replace(/\/+$/, ""));

export const monitoringWebhookSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(40),
  url: urlOrEmpty,
  enabled: z.boolean(),
});

export const monitoringConfigSchema = z.object({
  siteUrl: urlOrEmpty,
  healthCheckUrl: urlOrEmpty,
  backupUrl: urlOrEmpty,
  webhooks: z.array(monitoringWebhookSchema).max(10),
});

export const siteSettingsSchema = z.object({
  site_name: z.string().trim().min(1, "Site name is required").max(80),
  site_title: z.string().trim().min(1, "Site title is required").max(100),
  site_description: z.string().trim().max(300).default(""),
  tagline: z.string().trim().min(1, "Tagline is required").max(120),
  logo: mediaUrlOrReferenceSchema.nullish().transform((v) => (v && v.trim() !== "" ? v : null)),
  location: z.string().trim().min(1, "Location is required").max(120),
  contact_email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  contact_phone: z.string().trim().max(40).nullish(),
  booking_url: optionalUrl,
  social_github: optionalUrl,
  social_linkedin: optionalUrl,
  social_twitter: optionalUrl,
  social_fiverr: optionalUrl,
  social_instagram: optionalUrl,
  social_youtube: optionalUrl,
  footer_text: z.string().trim().min(1, "Footer text is required").max(200),
  maintenance_mode: z.boolean(),
  show_ai_chat: z.boolean(),
  show_hero: z.boolean(),
  show_showcase: z.boolean(),
  show_services: z.boolean(),
  show_case_studies: z.boolean(),
  show_about: z.boolean(),
  show_testimonials: z.boolean(),
  show_contact: z.boolean(),
  show_blog: z.boolean(),
  featured_projects_enabled: z.boolean(),
  featured_services_enabled: z.boolean(),
  ga4_measurement_id: z.string().trim().max(40).nullish(),
  gtm_id: z.string().trim().max(40).nullish(),
  clarity_project_id: z.string().trim().max(40).nullish(),
  nav_order: z.array(navItemSchema).min(1, "At least one navigation item is required").max(12),
  analytics_config: analyticsConfigSchema,
  dx_config: dxConfigSchema,
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;
