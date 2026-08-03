import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_ROW_ID, normalizeAnalyticsConfig } from "@/types/settings";
import { fireMonitoringWebhooks } from "@/lib/monitoring/actions";
import { notify } from "@/lib/notifications/sender";

/**
 * Nightly automated backup (Vercel cron 00:00 UTC, and optionally
 * triggered by the GitHub backup workflow).
 *
 * - Exports every content table (JSON) into the private `backups`
 *   storage bucket under `backups/<date>/tables/`.
 * - Stores a storage catalog (bucket/path/size/updated_at per file)
 *   so a missing-file audit is possible after a restore.
 * - Prunes analytics_events older than the configured retention.
 * - Prunes backup folders older than BACKUP_RETENTION_DAYS (30).
 * - Upserts one row into `backups` so the DX page shows status.
 *
 * Guarded to Vercel cron invocations (`x-vercel-cron: 1`); an
 * optional BACKUP_CRON_SECRET env value also allows out-of-band
 * triggers with `x-backup-key`.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const BACKUP_BUCKET = "backups";
const BACKUP_RETENTION_DAYS = 30;
const EXPORT_PAGE_SIZE = 1000;

/** Fetch every row of a table via range pagination (no silent truncation). */
async function fetchAllRows(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
): Promise<{ rows: unknown[]; error: string | null }> {
  const rows: unknown[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin
      .from(table as never)
      .select("*")
      .range(offset, offset + EXPORT_PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    const batch = (data ?? []) as unknown[];
    rows.push(...batch);
    if (batch.length < EXPORT_PAGE_SIZE) break;
    offset += EXPORT_PAGE_SIZE;
  }
  return { rows, error: null };
}

const CONTENT_TABLES = [
  "projects",
  "services",
  "blog_posts",
  "resources",
  "resource_files",
  "resource_categories",
  "resource_collections",
  "collection_items",
  "workflow_templates",
  "workflow_node_types",
  "workflow_categories",
  "user_workflows",
  "leads",
  "media_files",
  "content_entries",
  "seo_metadata",
  "testimonials",
  "case_studies",
  "site_settings",
];

interface CatalogFile {
  bucket: string;
  path: string;
  size: number;
  updatedAt: string;
}

function isAuthorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.BACKUP_CRON_SECRET;
  if (secret && request.headers.get("x-backup-key") === secret) return true;
  return false;
}

/** Scheduler source for attribution (vercel cron vs github workflow). */
function backupSource(request: Request): "vercel" | "github" {
  if (request.headers.get("x-vercel-cron") === "1") return "vercel";
  return "github";
}

async function listAllFiles(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
  out: CatalogFile[],
): Promise<void> {
  const { data: files, error } = await admin.storage
    .from(bucket)
    .list(prefix, { limit: 1000, offset: 0 });
  if (error) return;
  for (const file of files ?? []) {
    const metadata = file.metadata as { size?: number } | null;
    const isFile = metadata !== null && typeof metadata?.size === "number";
    if (isFile) {
      out.push({
        bucket,
        path: `${prefix}${file.name}`,
        size: metadata.size ?? 0,
        updatedAt: file.updated_at ?? "",
      });
    } else {
      await listAllFiles(admin, bucket, `${prefix}${file.name}/`, out);
    }
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const admin = createAdminClient();

    // Ensure the backups bucket exists.
    const { data: buckets } = await admin.storage.listBuckets();
    if (!(buckets ?? []).some((b) => b.name === BACKUP_BUCKET)) {
      await admin.storage.createBucket(BACKUP_BUCKET, { public: false });
    }

    const today = new Date().toISOString().slice(0, 10);
    const basePrefix = `${today}/`;
    let tableCount = 0;
    let sizeBytes = 0;
    const tableNames: string[] = [];
    const tableFailures: { table: string; error: string }[] = [];

    // 1) Table exports (paginated — a table larger than one page is fully
    //    backed up instead of silently truncated). Failures are recorded so
    //    the ledger/manifest reflects a partial export instead of masking it.
    for (const table of CONTENT_TABLES) {
      const { rows, error } = await fetchAllRows(admin, table);
      if (error) {
        tableFailures.push({ table, error });
        continue;
      }
      const json = JSON.stringify(rows, null, 2);
      const uploadRes = await admin.storage
        .from(BACKUP_BUCKET)
        .upload(`${basePrefix}tables/${table}.json`, json, {
          contentType: "application/json",
          upsert: true,
        });
      if (uploadRes.error) {
        tableFailures.push({ table, error: uploadRes.error.message });
      } else {
        tableCount += 1;
        sizeBytes += Buffer.byteLength(json);
        tableNames.push(table);
      }
    }

    // 2) Storage catalog (everything except the backups bucket itself).
    const catalog: CatalogFile[] = [];
    const catalogError: string | null = await (async () => {
      for (const bucket of buckets ?? []) {
        if (bucket.name === BACKUP_BUCKET) continue;
        const before = catalog.length;
        await listAllFiles(admin, bucket.name, "", catalog);
        if (catalog.length === before) {
          const probe = await admin.storage.from(bucket.name).list("", { limit: 1, offset: 0 });
          if (probe.error) return probe.error.message;
        }
      }
      return null;
    })();
    const catalogJson = JSON.stringify(catalog, null, 2);
    const catalogUpload = await admin.storage
      .from(BACKUP_BUCKET)
      .upload(`${basePrefix}storage-catalog.json`, catalogJson, {
        contentType: "application/json",
        upsert: true,
      });
    if (catalogUpload.error) {
      tableFailures.push({ table: "storage-catalog.json", error: catalogUpload.error.message });
    } else {
      sizeBytes += Buffer.byteLength(catalogJson);
    }

    // 3) Prune analytics_events beyond the configured retention.
    const { data: settingsRow } = (await admin
      .from("site_settings")
      .select("analytics_config")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle()) as unknown as { data: { analytics_config: unknown } | null };
    const analyticsConfig = normalizeAnalyticsConfig(settingsRow?.analytics_config);
    const retentionCutoff = new Date(
      Date.now() - analyticsConfig.retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    await admin.from("analytics_events").delete().lt("created_at", retentionCutoff);

    // 4) Prune old backup folders (keep 30 days).
    const cutoffDate = new Date(Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data: oldBackups } = await admin.storage
      .from(BACKUP_BUCKET)
      .list("", { limit: 1000, offset: 0 });
    for (const folder of oldBackups ?? []) {
      if (folder.name < cutoffDate && folder.name.length === 10) {
        const { data: files } = await admin.storage
          .from(BACKUP_BUCKET)
          .list(folder.name, { limit: 1000, offset: 0 });
        const paths = (files ?? [])
          .filter((f) => f.id !== null && f.id !== undefined)
          .map((f) => `${folder.name}/${f.id}`);
        if (paths.length > 0) {
          await admin.storage.from(BACKUP_BUCKET).remove(paths);
        }
      }
    }

    // 5) Ledger row for the DX page. A partial export is recorded honestly:
    //    status reflects any failures and the manifest lists them.
    const allFailed = tableFailures.length === CONTENT_TABLES.length;
    const status = allFailed ? "error" : tableFailures.length > 0 ? "partial" : "ok";
    const manifest = {
      tables: tableNames,
      catalogFiles: catalog.length,
      catalogError: catalogError ?? undefined,
      failures: tableFailures,
    };
    await admin.from("backups").upsert(
      {
        backup_date: today,
        status,
        table_count: tableCount,
        file_count: catalog.length,
        size_bytes: sizeBytes,
        manifest,
        updated_at: new Date().toISOString(),
        source: backupSource(request),
      } as never,
      { onConflict: "backup_date,source" },
    );

    // Notify configured webhooks on partial/failed backups so the admin
    // knows even if nobody visits the dashboard.
    if (status !== "ok") {
      await fireMonitoringWebhooks("backup", {
        detail:
          status === "error"
            ? `Backup failed: ${tableFailures[0]?.error ?? "unknown error"}`
            : `Backup partially completed (${tableFailures.length} of ${CONTENT_TABLES.length} exports failed).`,
        source: backupSource(request),
      });
      await notify(status === "error" ? "backup.failed" : "backup.partial", {
        title: status === "error" ? "Backup failed" : "Backup partially failed",
        description:
          status === "error"
            ? (tableFailures[0]?.error ?? "The backup reported an unknown error.")
            : `${tableFailures.length} of ${CONTENT_TABLES.length} table exports failed.`,
        fields: { Tables: `${tableCount}/${CONTENT_TABLES.length}`, Source: backupSource(request) },
      });
    } else {
      await notify("backup.ok", {
        fields: {
          Tables: `${tableCount}`,
          SizeBytes: `${sizeBytes}`,
          Source: backupSource(request),
        },
      });
    }

    return NextResponse.json(
      {
        ok: allFailed ? false : true,
        backupDate: today,
        tables: tableCount,
        catalogFiles: catalog.length,
        sizeBytes,
        failures: tableFailures,
        totalMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" }, status: allFailed ? 500 : 200 },
    );
  } catch (err) {
    // Record the failure so the dashboard can show a real error instead of
    // a stale "no backup today" state.
    try {
      const admin = createAdminClient();
      await admin.from("backups").upsert(
        {
          backup_date: new Date().toISOString().slice(0, 10),
          status: "error",
          table_count: 0,
          file_count: 0,
          size_bytes: 0,
          manifest: { error: err instanceof Error ? err.message : "Backup failed" },
          updated_at: new Date().toISOString(),
          source: backupSource(request),
        } as never,
        { onConflict: "backup_date,source" },
      );
    } catch {
      // Ledger write failure must not mask the original error.
    }
    // Notify configured webhooks (best-effort) so the admin knows the
    // nightly backup failed even if nobody visits the dashboard.
    await fireMonitoringWebhooks("backup", {
      detail: err instanceof Error ? err.message : "Backup failed",
      source: "api/backup",
    });
    await notify("backup.failed", {
      title: "Backup failed",
      description: err instanceof Error ? err.message : "The backup reported an unknown error.",
      fields: { Source: "api/backup" },
    });
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Backup failed",
        totalMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
