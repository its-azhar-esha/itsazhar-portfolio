"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteSettingsSchema } from "@/lib/validation";
import { saveSettings } from "./repository";
import type { SiteSettings } from "@/types/settings";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";

export async function saveSiteSettingsAction(
  input: Record<string, unknown>,
): Promise<Result<SiteSettings>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = siteSettingsSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await saveSettings(parsed.data);
    if (result.success) {
      revalidatePath("/", "layout");
      revalidatePath("/admin/settings");
    }
    return result;
  } catch (err) {
    logError("saveSiteSettingsAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save site settings");
  }
}
