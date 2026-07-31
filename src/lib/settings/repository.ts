import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { SiteSettings, SiteSettingsInput } from "@/types/settings";
import { SETTINGS_ROW_ID, DEFAULT_SITE_SETTINGS } from "@/types/settings";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "site_settings" as const;

function rowToSiteSettings(
  row: Database["public"]["Tables"]["site_settings"]["Row"],
): SiteSettings {
  return {
    id: row.id,
    site_name: row.site_name,
    tagline: row.tagline,
    location: row.location,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    social_github: row.social_github,
    social_linkedin: row.social_linkedin,
    social_twitter: row.social_twitter,
    social_fiverr: row.social_fiverr,
    footer_text: row.footer_text,
    maintenance_mode: row.maintenance_mode,
    show_ai_chat: row.show_ai_chat,
    featured_projects_enabled: row.featured_projects_enabled,
    featured_services_enabled: row.featured_services_enabled,
    ga4_measurement_id: row.ga4_measurement_id,
    gtm_id: row.gtm_id,
    clarity_project_id: row.clarity_project_id,
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
