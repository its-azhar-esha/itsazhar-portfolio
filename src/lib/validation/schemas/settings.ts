import { z } from "zod";

const optionalUrl = z
  .union([z.string().url(), z.string().email(), z.literal("")])
  .nullish()
  .transform((v) => (v && v.trim() !== "" ? v : null));

export const siteSettingsSchema = z.object({
  site_name: z.string().trim().min(1, "Site name is required").max(80),
  tagline: z.string().trim().min(1, "Tagline is required").max(120),
  location: z.string().trim().min(1, "Location is required").max(120),
  contact_email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  contact_phone: z.string().trim().max(40).nullish(),
  social_github: optionalUrl,
  social_linkedin: optionalUrl,
  social_twitter: optionalUrl,
  social_fiverr: optionalUrl,
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
  featured_projects_enabled: z.boolean(),
  featured_services_enabled: z.boolean(),
  ga4_measurement_id: z.string().trim().max(40).nullish(),
  gtm_id: z.string().trim().max(40).nullish(),
  clarity_project_id: z.string().trim().max(40).nullish(),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;
