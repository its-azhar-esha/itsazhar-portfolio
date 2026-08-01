"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import {
  captureContentVersion,
  listContentVersions,
  getContentVersionById,
  type ContentVersion,
} from "./repository";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";

const ENTITY_TABLES: Record<string, string> = {
  blog_posts: "blog_posts",
  projects: "projects",
  services: "services",
};

const SYSTEM_COLUMNS = ["id", "created_at", "updated_at"];

function revalidateEntity(entity: string, slug?: string): void {
  if (entity === "blog_posts") {
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    if (slug) revalidatePath(`/blog/${slug}`);
  } else if (entity === "projects") {
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    revalidatePath("/sitemap.xml");
    if (slug) revalidatePath(`/projects/${slug}`);
  } else if (entity === "services") {
    revalidatePath("/admin/services");
    revalidatePath("/services");
  }
}

export async function listContentVersionsAction(
  entity: string,
  entityId: string,
): Promise<Result<ContentVersion[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");
    return listContentVersions(entity, entityId);
  } catch (err) {
    logError("listContentVersionsAction failed", {
      entity,
      entityId,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list content versions");
  }
}

export async function restoreContentVersionAction(
  entity: string,
  versionId: string,
): Promise<Result<ContentVersion>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const table = ENTITY_TABLES[entity];
    if (!table) return fail(`Unsupported entity "${entity}".`);

    const versionResult = await getContentVersionById(versionId);
    if (!versionResult.success) return versionResult;
    const version = versionResult.data;

    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(version.data)) {
      if (!SYSTEM_COLUMNS.includes(key)) payload[key] = value;
    }

    const admin = await createAdminClient();
    const { data: restored, error } = await admin
      .from(table as never)
      .update(payload as never)
      .eq("id", version.entityId)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!restored) return fail(`No ${entity} row found with id "${version.entityId}".`);

    await captureContentVersion(entity, version.entityId, restored, user.id);
    await logAudit({
      action: "content.restored",
      entity,
      entityId: version.entityId,
      detail: { version: version.version },
    });

    const slug = (payload.slug as string) || (version.data.slug as string) || undefined;
    revalidateEntity(entity, slug);
    return ok(version);
  } catch (err) {
    logError("restoreContentVersionAction failed", {
      entity,
      versionId,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to restore content version");
  }
}
