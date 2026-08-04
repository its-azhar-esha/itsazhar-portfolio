import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { SiteSettings, SiteSettingsInput } from "@/types/settings";
import {
  SETTINGS_ROW_ID,
  DEFAULT_SITE_SETTINGS,
  normalizeNavOrder,
  normalizeAnalyticsConfig,
  normalizeDxConfig,
  normalizeMonitoringConfig,
  normalizeAiConfig,
} from "@/types/settings";
import { normalizeNotificationConfig } from "@/types/notifications";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "site_settings" as const;

function rowToSiteSettings(
  row: Database["public"]["Tables"]["site_settings"]["Row"],
): SiteSettings {
  return {
    id: row.id,
    site_name: row.site_name,
    site_title: row.site_title,
    site_description: row.site_description,
    tagline: row.tagline,
    logo: row.logo,
    location: row.location,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    booking_url: row.booking_url,
    social_github: row.social_github,
    social_linkedin: row.social_linkedin,
    social_twitter: row.social_twitter,
    social_fiverr: row.social_fiverr,
    social_instagram: row.social_instagram,
    social_youtube: row.social_youtube,
    footer_text: row.footer_text,
    maintenance_mode: row.maintenance_mode,
    show_ai_chat: row.show_ai_chat,
    show_hero: row.show_hero,
    show_showcase: row.show_showcase,
    show_services: row.show_services,
    show_case_studies: row.show_case_studies,
    show_about: row.show_about,
    show_testimonials: row.show_testimonials,
    show_contact: row.show_contact,
    show_blog: row.show_blog,
    show_hub: row.show_hub,
    show_playground: row.show_playground,
    featured_projects_enabled: row.featured_projects_enabled,
    featured_services_enabled: row.featured_services_enabled,
    ga4_measurement_id: row.ga4_measurement_id,
    gtm_id: row.gtm_id,
    clarity_project_id: row.clarity_project_id,
    nav_order: normalizeNavOrder(row.nav_order),
    analytics_config: normalizeAnalyticsConfig(row.analytics_config),
    dx_config: normalizeDxConfig(row.dx_config),
    monitoring_config: normalizeMonitoringConfig(row.monitoring_config),
    notification_config: normalizeNotificationConfig(row.notification_config),
    ai_config: normalizeAiConfig(row.ai_config),
    custom_knowledge: row.custom_knowledge ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSettings(): Promise<Result<SiteSettings | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(rowToSiteSettings(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load site settings");
  }
}

export async function saveSettings(input: SiteSettingsInput): Promise<Result<SiteSettings>> {
  try {
    const supabase = await createClient();
    const payload = { ...input, id: SETTINGS_ROW_ID };
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload as never, { onConflict: "id" })
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to save site settings — no data returned.");
    return ok(rowToSiteSettings(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save site settings");
  }
}

export function settingsWithDefaults(settings: SiteSettings | null | undefined): SiteSettings {
  if (!settings) {
    return {
      id: SETTINGS_ROW_ID,
      ...DEFAULT_SITE_SETTINGS,
      created_at: "",
      updated_at: "",
    };
  }
  return settings;
}
