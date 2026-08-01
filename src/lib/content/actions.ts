"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createContentSchema,
  updateContentSchema,
  pageContentSchema,
  contentKeySchema,
} from "@/lib/validation";
import { create, update, remove, findByKey } from "./repository";
import { getPageContentDefinition } from "./schemas";
import type { ContentEntry, CreateContentInput, UpdateContentInput } from "@/types/content";
import type { Result } from "@/lib/result";
import { fail, ok } from "@/lib/result";

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

/**
 * Upserts the content entry for a registered page key. Creates the entry on
 * first save, updates it afterwards. Revalidates the whole site since page
 * content is consumed across public routes.
 */
export async function savePageContentAction(input: {
  key: string;
  content: Record<string, unknown>;
}): Promise<Result<ContentEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const definition = getPageContentDefinition(input.key);
    if (!definition) return fail(`Unknown page content key "${input.key}".`);

    const keyParsed = contentKeySchema.safeParse(input.key);
    if (!keyParsed.success) return fail(keyParsed.error.issues.map((i) => i.message).join("; "));
    const contentParsed = pageContentSchema.safeParse(input.content);
    if (!contentParsed.success) {
      return fail("Page content must be a JSON object.");
    }

    const existing = await findByKey(input.key);
    if (!existing.success) return existing;

    if (existing.data) {
      const result = await update(existing.data.id, {
        content: contentParsed.data as Record<string, unknown>,
      });
      if (result.success) {
        revalidatePath("/", "layout");
        revalidatePath("/admin/content");
        await logAudit({
          action: "page-content.updated",
          entity: "content_entries",
          entityId: existing.data.id,
          detail: { key: input.key },
        });
      }
      return result;
    }

    const result = await create({
      key: input.key,
      title: definition.title,
      content: contentParsed.data as Record<string, unknown>,
      status: "published",
    });
    if (result.success) {
      revalidatePath("/", "layout");
      revalidatePath("/admin/content");
      await logAudit({
        action: "page-content.created",
        entity: "content_entries",
        entityId: result.data.id,
        detail: { key: input.key },
      });
    }
    return result;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save page content");
  }
}

/** Public read of a registered page content entry (raw stored JSON, no defaults). */
export async function getPageContentAction(
  key: string,
): Promise<Result<Record<string, unknown> | null>> {
  try {
    const result = await findByKey(key);
    if (!result.success) return fail(result.error);
    if (!result.data?.content) return ok(null);
    return ok(result.data.content as Record<string, unknown>);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load page content");
  }
}
