"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { findByKey, create, update } from "@/lib/content/repository";
import { aboutContentSchema } from "@/lib/validation";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import type { ContentEntry } from "@/types/content";

const ABOUT_KEY = "about";

export async function saveAboutContentAction(
  input: Record<string, unknown>,
): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = aboutContentSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const existing = await findByKey(ABOUT_KEY);
    if (!existing.success) return existing;

    if (existing.data) {
      const result = await update(existing.data.id, {
        content: parsed.data as unknown as Record<string, unknown>,
      });
      if (result.success) {
        revalidatePath("/admin/content");
        await logAudit({
          action: "about.updated",
          entity: "content_entries",
          entityId: existing.data.id,
        });
      }
      return result;
    }

    const result = await create({
      key: ABOUT_KEY,
      title: "About Page",
      content: parsed.data as unknown as Record<string, unknown>,
      status: "published",
    });
    if (result.success) {
      revalidatePath("/admin/content");
      await logAudit({
        action: "about.updated",
        entity: "content_entries",
        entityId: result.data.id,
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save about content");
  }
}
