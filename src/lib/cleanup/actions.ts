"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/sender";
import { CLEANUP_CATEGORIES, getCleanupCategory } from "./registry";
import { cleanupRequestSchema } from "@/lib/validation";
import type {
  CleanupCategoryMeta,
  CleanupOverview,
  CleanupRequest,
  CleanupResult,
  ScanResult,
  ScanState,
} from "./types";

/** Static metadata (no scan functions) — safe to ship to the client. */
function meta(category: (typeof CLEANUP_CATEGORIES)[number]): CleanupCategoryMeta {
  return {
    id: category.id,
    title: category.title,
    description: category.description,
    icon: category.icon,
    group: category.group,
    helpId: category.helpId,
    dangerous: category.dangerous,
    retention: category.retention,
  };
}

const GROUP_ORDER = ["media", "storage", "logs", "content", "references"] as const;

type ScanRow = {
  category: string;
  scanned_at: string;
  status: string;
  total: number;
  size_bytes: number;
  summary: Record<string, unknown> | null;
};

export async function getCleanupOverviewAction(): Promise<Result<CleanupOverview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const { data: scanRows } = await admin.from("cleanup_scans").select("*");
    const rows = (scanRows ?? []) as ScanRow[];
    const byCategory = new Map(rows.map((r) => [r.category, r]));

    const categories = CLEANUP_CATEGORIES.map((c) => {
      const stored = byCategory.get(c.id);
      const m = meta(c);
      return {
        ...m,
        scan: stored
          ? ({
              category: stored.category,
              scannedAt: stored.scanned_at,
              status: (["clean", "issues", "error"].includes(stored.status)
                ? stored.status
                : "clean") as ScanState["status"],
              total: stored.total,
              sizeBytes: stored.size_bytes,
              summary: stored.summary ?? {},
            } satisfies ScanState)
          : null,
      };
    }).sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.group as (typeof GROUP_ORDER)[number]) -
        GROUP_ORDER.indexOf(b.group as (typeof GROUP_ORDER)[number]),
    );

    const latest = rows
      .map((r) => r.scanned_at)
      .sort()
      .at(-1);

    return ok({ categories, scannedAt: latest ?? null });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load cleanup overview");
  }
}

export async function runCleanupScanAction(categoryId: string): Promise<Result<ScanResult>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const category = getCleanupCategory(categoryId);
    if (!category) return fail("Unknown cleanup category.");

    const scan = await category.scan();
    if (scan.ok) {
      const admin = createAdminClient();
      const { error } = await admin.from("cleanup_scans").upsert(
        {
          category: categoryId,
          scanned_at: new Date().toISOString(),
          status: scan.status,
          total: scan.total,
          size_bytes: scan.sizeBytes,
          summary: { message: scan.message },
          items: scan.items,
        } as never,
        { onConflict: "category" },
      );
      if (error) {
        return fail(`Scan completed but could not be recorded: ${error.message}`);
      }
      revalidatePath("/admin/storage");
      return ok(scan);
    }
    return fail(scan.message);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Scan failed");
  }
}

export async function runCleanupAction(
  categoryId: string,
  request: CleanupRequest | null,
): Promise<Result<CleanupResult>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const category = getCleanupCategory(categoryId);
    if (!category) return fail("Unknown cleanup category.");

    if (request) {
      const parsed = cleanupRequestSchema.safeParse(request);
      if (!parsed.success) {
        return fail(parsed.error.issues.map((i) => i.message).join("; "));
      }
      request = parsed.data;
    }

    // The cleanup re-verifies everything from the live database/storage at
    // execution time — stale scan results are never trusted for deletion.
    const result = await category.cleanup(request);

    // Record the post-cleanup state so the card reflects reality.
    const admin = createAdminClient();
    const after = await category.scan();
    if (after.ok) {
      await admin.from("cleanup_scans").upsert(
        {
          category: categoryId,
          scanned_at: new Date().toISOString(),
          status: after.status,
          total: after.total,
          size_bytes: after.sizeBytes,
          summary: { message: after.message },
        } as never,
        { onConflict: "category" },
      );
    }

    revalidatePath("/admin/storage");
    await logAudit({
      action: "cleanup.run",
      entity: categoryId,
      entityId: categoryId,
      detail: {
        deleted: result.deleted,
        sizeBytes: result.sizeBytes,
        breakdown: result.breakdown,
        request: request ?? null,
      },
    });
    await notify("cleanup.completed", {
      title: "Storage cleanup completed",
      description: `${category.title}: ${result.message}`,
      fields: {
        Category: category.title,
        Deleted: String(result.deleted),
        SizeBytes: String(result.sizeBytes),
      },
    });
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup failed";
    await logAudit({
      action: "cleanup.failed",
      entity: categoryId,
      detail: { message },
    }).catch(() => {});
    return fail(message);
  }
}
