import { cache } from "react";
import { getSettings, settingsWithDefaults } from "./repository";
import type { SiteSettings } from "@/types/settings";

export const getPublicSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const result = await getSettings();
    if (!result.success) return settingsWithDefaults(null);
    return settingsWithDefaults(result.data);
  } catch {
    return settingsWithDefaults(null);
  }
});
