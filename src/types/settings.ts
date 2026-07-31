export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  location: string;
  contact_email: string;
  contact_phone: string | null;
  social_github: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_fiverr: string | null;
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
  featured_projects_enabled: boolean;
  featured_services_enabled: boolean;
  ga4_measurement_id: string | null;
  gtm_id: string | null;
  clarity_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteSettingsInput = Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>;

export const SETTINGS_ROW_ID = "00000000-0000-0000-0000-000000000001";

export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, "id" | "created_at" | "updated_at"> = {
  site_name: "Azhar",
  tagline: "AI Automation Specialist",
  location: "Remote, Worldwide",
  contact_email: "azharmahmudalif@gmail.com",
  contact_phone: null,
  social_github: "https://github.com/azharmahmudalif",
  social_linkedin: "https://linkedin.com/in/azharmahmudalif",
  social_twitter: "https://x.com/azhar_m_alif",
  social_fiverr: "https://fiverr.com/azhar_m_alif",
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
  featured_projects_enabled: true,
  featured_services_enabled: true,
  ga4_measurement_id: null,
  gtm_id: null,
  clarity_project_id: null,
};
