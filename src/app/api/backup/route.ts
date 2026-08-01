import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_ROW_ID, normalizeAnalyticsConfig } from "@/types/settings";

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

    // 1) Table exports.
    for (const table of CONTENT_TABLES) {
      const { data, error } = await admin
        .from(table as never)
        .select("*")
        .limit(1000);
      if (error) continue;
      const json = JSON.stringify(data ?? [], null, 2);
      const uploadRes = await admin.storage
        .from(BACKUP_BUCKET)
        .upload(`${basePrefix}tables/${table}.json`, json, {
          contentType: "application/json",
          upsert: true,
        });
      if (!uploadRes.error) {
        tableCount += 1;
        sizeBytes += Buffer.byteLength(json);
        tableNames.push(table);
      }
    }

    // 2) Storage catalog (everything except the backups bucket itself).
    const catalog: CatalogFile[] = [];
    for (const bucket of buckets ?? []) {
      if (bucket.name === BACKUP_BUCKET) continue;
      await listAllFiles(admin, bucket.name, "", catalog);
    }
    const catalogJson = JSON.stringify(catalog, null, 2);
    await admin.storage
      .from(BACKUP_BUCKET)
      .upload(`${basePrefix}storage-catalog.json`, catalogJson, {
        contentType: "application/json",
        upsert: true,
      });
    sizeBytes += Buffer.byteLength(catalogJson);

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

    // 5) Ledger row for the DX page.
    const manifest = { tables: tableNames, catalogFiles: catalog.length };
    await admin.from("backups").upsert(
      {
        backup_date: today,
        status: "ok",
        table_count: tableCount,
        file_count: catalog.length,
        size_bytes: sizeBytes,
        manifest,
      } as never,
      { onConflict: "backup_date" },
    );

    return NextResponse.json(
      {
        ok: true,
        backupDate: today,
        tables: tableCount,
        catalogFiles: catalog.length,
        sizeBytes,
        totalMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
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
