"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createSeoSchema, updateSeoSchema } from "@/lib/validation";
import { createSeo, updateSeo, deleteSeo } from "./repository";
import type { SeoEntry, CreateSeoInput, UpdateSeoInput } from "@/types/seo";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { notify } from "@/lib/notifications/sender";

function revalidateSeoPaths(pageKey: string): void {
  revalidatePath("/admin/seo");
  if (pageKey === "home") {
    revalidatePath("/");
  } else if (pageKey === "about") {
    revalidatePath("/about");
  } else if (pageKey === "projects") {
    revalidatePath("/projects");
  } else if (pageKey === "contact") {
    revalidatePath("/contact");
  }
}

export async function createSeoAction(input: Record<string, unknown>): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createSeoSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createSeo(parsed.data as CreateSeoInput);
    if (result.success) {
      revalidateSeoPaths(parsed.data.page_key);
      await logAudit({
        action: "seo.created",
        entity: "seo",
        entityId: result.data.id,
        detail: { pageKey: result.data.page_key },
      });
      await notify("seo.created", { fields: { PageKey: result.data.page_key } });
    }
    return result;
  } catch (err) {
    logError("createSeoAction failed", { message: err instanceof Error ? err.message : err });
    return fail(err instanceof Error ? err.message : "Failed to create SEO entry");
  }
}

export async function updateSeoAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<SeoEntry>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateSeoSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateSeo(id, parsed.data as UpdateSeoInput);
    if (result.success) {
      revalidateSeoPaths(parsed.data.page_key ?? "");
      await logAudit({
        action: "seo.updated",
        entity: "seo",
        entityId: id,
        detail: { pageKey: result.data.page_key },
      });
      await notify("seo.updated", { fields: { PageKey: result.data.page_key } });
    }
    return result;
  } catch (err) {
    logError("updateSeoAction failed", { id, message: err instanceof Error ? err.message : err });
    return fail(err instanceof Error ? err.message : "Failed to update SEO entry");
  }
}

export async function deleteSeoAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteSeo(id);
    if (result.success) {
      revalidatePath("/admin/seo");
      await logAudit({ action: "seo.deleted", entity: "seo", entityId: id });
      await notify("seo.deleted", { fields: { SeoId: id } });
    }
    return result;
  } catch (err) {
    logError("deleteSeoAction failed", { id, message: err instanceof Error ? err.message : err });
    return fail(err instanceof Error ? err.message : "Failed to delete SEO entry");
  }
}
