"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createContentSchema, updateContentSchema } from "@/lib/validation";
import { create, update, remove } from "./repository";
import type { ContentEntry, CreateContentInput, UpdateContentInput } from "@/types/content";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";

export async function createContentAction(
  input: Record<string, unknown>,
): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createContentSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await create(parsed.data as CreateContentInput);
    if (result.success) {
      revalidatePath("/admin/content");
      await logAudit({
        action: "content.created",
        entity: "content_entries",
        entityId: result.data.id,
        detail: { key: result.data.key },
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create content");
  }
}

export async function updateContentAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateContentSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await update(id, parsed.data as UpdateContentInput);
    if (result.success) {
      revalidatePath("/admin/content");
      await logAudit({
        action: "content.updated",
        entity: "content_entries",
        entityId: id,
        detail: { key: result.data.key },
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update content");
  }
}

export async function deleteContentAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await remove(id);
    if (result.success) {
      revalidatePath("/admin/content");
      await logAudit({ action: "content.deleted", entity: "content_entries", entityId: id });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete content");
  }
}
