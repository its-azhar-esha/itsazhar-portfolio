import { getSettings, settingsWithDefaults } from "./repository";
import type { SiteSettings } from "@/types/settings";

export async function getPublicSiteSettings(): Promise<SiteSettings> {
  try {
    const result = await getSettings();
    if (!result.success) return settingsWithDefaults(null);
    return settingsWithDefaults(result.data);
  } catch {
    return settingsWithDefaults(null);
  }
}
