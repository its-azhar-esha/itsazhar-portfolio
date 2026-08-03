/**
 * Storage & Cleanup — category registry.
 *
 * Each category is one card on /admin/storage. Adding a new category is just
 * adding one object here (plus a help entry and an icon mapping in the UI):
 * - `scan()`      — read-only, real Supabase queries; never mutates. Returns
 *                   a capped sample for the UI plus true totals.
 * - `cleanup()`   — NEVER trusts the scan sample. It re-fetches the full
 *                   candidate set from the database/storage at execution
 *                   time, applies the requested retention rule, and only then
 *                   deletes. Anything that cannot be verified is left alone.
 *
 * All database work uses the service-role admin client (cleanup tables like
 * audit_log / login_history are service-role-only). Storage operations use
 * the same client so the private `backups` bucket is reachable.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getUsedMediaRefs } from "@/lib/media/repository";
import { SETTINGS_ROW_ID, normalizeAnalyticsConfig } from "@/types/settings";
import type {
  CleanupCategory,
  CleanupItem,
  CleanupRequest,
  CleanupResult,
  ScanResult,
} from "./types";

/* ─── Shared helpers ─── */

const MEDIA_BUCKET = "media";
const BACKUP_BUCKET = "backups";
const RESERVED_BUCKETS = new Set([MEDIA_BUCKET, BACKUP_BUCKET]);
const SAMPLE_CAP = 500;

function cleanResult(total: number, sizeBytes: number, items: CleanupItem[]): ScanResult {
  return {
    ok: true,
    status: total > 0 ? "issues" : "clean",
    total,
    sizeBytes,
    items,
    message:
      total === 0
        ? "Nothing found — all verified in use."
        : `${total} candidate(s) found (${sizeBytes > 0 ? `${Math.round(sizeBytes / 1024)} KB` : "N/A"}).`,
  };
}

function errorResult(message: string): ScanResult {
  return { ok: false, status: "error", total: 0, sizeBytes: 0, items: [], message, error: message };
}

/** Fetch every row of a table via range pagination (no truncation). */
async function fetchTimedRows<T extends { id: string; created_at: string }>(
  table: string,
  columns: string,
): Promise<T[]> {
  const admin = createAdminClient();
  const rows: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin
      .from(table as never)
      .select(columns)
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw new Error(error.message);
    const batch = ((data ?? []) as T[]).filter((r) => Boolean(r) && typeof r.id === "string");
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

async function deleteRows(table: string, ids: string[], label: string): Promise<CleanupResult> {
  const admin = createAdminClient();
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const { data, error } = await admin
      .from(table as never)
      .delete()
      .in("id", chunk)
      .select("id");
    if (error) throw new Error(`Failed to delete ${label}: ${error.message}`);
    deleted += (data ?? []).length;
  }
  return {
    deleted,
    sizeBytes: 0,
    breakdown: [{ label, count: deleted }],
    message: `Deleted ${deleted} ${label} record(s).`,
  };
}

/** Map a retention request to a SQL-style cutoff for keep-days mode. */
function daysCutoff(request: CleanupRequest | null, fallbackDays: number): string {
  const days = request?.mode === "keep-days" ? request.value : fallbackDays;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function emptyOutcome(message: string): CleanupResult {
  return { deleted: 0, sizeBytes: 0, breakdown: [], message };
}

/* ─── Media: unused images / files / duplicates ─── */

function unusedMediaScan(kind: "image" | "non-image"): () => Promise<ScanResult> {
  return async () => {
    try {
      const admin = createAdminClient();
      const used = await getUsedMediaRefs();
      const { data, error } = await admin
        .from("media_files")
        .select("id,original_name,size_bytes,mime_type,created_at");
      if (error) return errorResult(error.message);
      const rows = (
        (data ?? []) as {
          id: string;
          original_name: string;
          size_bytes: number | null;
          mime_type: string | null;
          created_at: string;
        }[]
      ).filter((row) => !used.has(`media:${row.id}`));
      const matches = rows.filter((row) =>
        kind === "image"
          ? (row.mime_type ?? "").startsWith("image/")
          : !(row.mime_type ?? "").startsWith("image/"),
      );
      const items: CleanupItem[] = matches
        .sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0))
        .map((row) => ({
          id: row.id,
          name: row.original_name || row.id,
          detail: `${row.mime_type ?? "unknown"} · ${row.created_at.slice(0, 10)}`,
          sizeBytes: row.size_bytes ?? 0,
        }));
      return cleanResult(
        matches.length,
        matches.reduce((s, r) => s + (r.size_bytes ?? 0), 0),
        items.slice(0, SAMPLE_CAP),
      );
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

/** Delete media rows + their storage objects (reuses the media module). */
async function deleteMediaRows(ids: string[], label: string): Promise<CleanupResult> {
  const { bulkDeleteMedia } = await import("@/lib/media/repository");
  const result = await bulkDeleteMedia(ids);
  if (!result.success) throw new Error(result.error);
  return {
    deleted: result.data.deleted,
    sizeBytes: 0,
    breakdown: [{ label, count: result.data.deleted }],
    message: `Deleted ${result.data.deleted} ${label}(s) (rows + storage objects).`,
  };
}

function duplicateMediaScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const admin = createAdminClient();
      const used = await getUsedMediaRefs();
      const { data, error } = await admin
        .from("media_files")
        .select("id,original_name,size_bytes,mime_type,created_at");
      if (error) return errorResult(error.message);
      const rows = (data ?? []) as {
        id: string;
        original_name: string;
        size_bytes: number | null;
        mime_type: string | null;
        created_at: string;
      }[];
      // Group by exact size + mime. A member is a removable duplicate only
      // when an identical twin is still referenced by the CMS. Unreferenced
      // copies are already covered by "unused media"; here we only flag
      // extra copies that share size+mime with a *referenced* original.
      const groups = new Map<string, typeof rows>();
      for (const row of rows) {
        const key = `${row.size_bytes ?? 0}|${row.mime_type ?? ""}`;
        const g = groups.get(key) ?? [];
        g.push(row);
        groups.set(key, g);
      }
      const items: CleanupItem[] = [];
      for (const group of groups.values()) {
        if (group.length < 2) continue;
        const hasReferenced = group.some((r) => used.has(`media:${r.id}`));
        if (!hasReferenced) continue;
        for (const row of group) {
          if (used.has(`media:${row.id}`)) continue;
          items.push({
            id: row.id,
            name: row.original_name || row.id,
            detail: `${row.mime_type ?? "unknown"} · duplicate copy`,
            sizeBytes: row.size_bytes ?? 0,
          });
        }
      }
      return cleanResult(
        items.length,
        items.reduce((s, i) => s + (i.sizeBytes ?? 0), 0),
        items.slice(0, SAMPLE_CAP),
      );
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

/* ─── Storage: orphan objects, empty buckets, old backup files ─── */

function orphanObjectsScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const admin = createAdminClient();
      const { data: mediaRows, error } = await admin
        .from("media_files")
        .select("storage_path,bucket");
      if (error) return errorResult(error.message);
      const tracked = new Set(
        ((mediaRows ?? []) as { storage_path: string; bucket: string }[]).map(
          (m) => `${m.bucket}/${m.storage_path}`,
        ),
      );
      const items: CleanupItem[] = [];
      const scanBucket = async (bucket: string, prefix: string): Promise<void> => {
        const { data: files, error: listError } = await admin.storage
          .from(bucket)
          .list(prefix, { limit: 1000, offset: 0 });
        if (listError) return;
        for (const file of files ?? []) {
          const meta = file.metadata as { size?: number } | null;
          if (meta !== null && typeof meta?.size === "number") {
            const key = `${prefix}${file.name}`;
            if (!tracked.has(`${bucket}/${key}`)) {
              items.push({
                id: key,
                name: key,
                detail: `bucket: ${bucket}`,
                sizeBytes: meta.size ?? 0,
              });
            }
          } else {
            await scanBucket(bucket, `${prefix}${file.name}/`);
          }
        }
      };
      await scanBucket(MEDIA_BUCKET, "");
      return cleanResult(
        items.length,
        items.reduce((s, i) => s + (i.sizeBytes ?? 0), 0),
        items.slice(0, SAMPLE_CAP),
      );
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

function emptyBucketScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const admin = createAdminClient();
      const { data: buckets, error } = await admin.storage.listBuckets();
      if (error) return errorResult(error.message);
      const items: CleanupItem[] = [];
      for (const bucket of buckets ?? []) {
        if (RESERVED_BUCKETS.has(bucket.name)) continue;
        const { data: files } = await admin.storage
          .from(bucket.name)
          .list("", { limit: 1000, offset: 0 });
        if (!files || files.length > 0) continue;
        items.push({ id: bucket.name, name: bucket.name, detail: "empty bucket" });
      }
      return cleanResult(items.length, 0, items.slice(0, SAMPLE_CAP));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

function oldBackupFilesScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const admin = createAdminClient();
      const { data: files, error } = await admin.storage
        .from(BACKUP_BUCKET)
        .list("", { limit: 1000, offset: 0 });
      if (error) return errorResult(error.message);
      const items: CleanupItem[] = (files ?? [])
        .filter((f) => f.name.length === 10) // only YYYY-MM-DD folders
        .map((f) => ({
          id: f.name,
          name: f.name,
          detail: "backup folder",
        }));
      return cleanResult(items.length, 0, items.slice(0, SAMPLE_CAP));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

async function removeBackupFolders(folders: string[]): Promise<CleanupResult> {
  const admin = createAdminClient();
  let deleted = 0;
  for (const folder of folders) {
    const { data: files, error } = await admin.storage
      .from(BACKUP_BUCKET)
      .list(folder, { limit: 1000, offset: 0 });
    if (error) continue;
    const paths = (files ?? [])
      .filter((f) => f.id !== null && f.id !== undefined)
      .map((f) => `${folder}/${f.id}`);
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from(BACKUP_BUCKET).remove(paths);
      if (!removeError) deleted += paths.length;
    }
  }
  return {
    deleted,
    sizeBytes: 0,
    breakdown: [{ label: "backup files", count: deleted }],
    message: `Removed ${deleted} old backup file(s).`,
  };
}

/* ─── Retention rows (service-role-only tables) ─── */

function timestampRowScan(
  table: string,
  nameColumn: string,
  label: string,
): () => Promise<ScanResult> {
  return async () => {
    try {
      const rows = await fetchTimedRows(table, `id,${nameColumn},created_at`);
      const items: CleanupItem[] = rows.map((r) => ({
        id: r.id,
        name: label,
        detail: r.created_at.slice(0, 10),
        sizeBytes: 0,
      }));
      return cleanResult(rows.length, 0, items.slice(0, SAMPLE_CAP));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

/** Generic cleanup for timestamped row tables (keep-days / keep-records / keep-latest). */
function timedRowCleanup(table: string, label: string, defaultDays: number) {
  return async (request: CleanupRequest | null): Promise<CleanupResult> => {
    const rows = await fetchTimedRows(table, "id,created_at");
    let targets: string[];
    if (!request || request.mode === "keep-days") {
      const cutoff = daysCutoff(request, defaultDays);
      targets = rows.filter((r) => r.created_at < cutoff).map((r) => r.id);
    } else if (request.mode === "keep-records") {
      targets = rows.slice(request.value).map((r) => r.id);
    } else {
      targets = rows.slice(1).map((r) => r.id);
    }
    if (targets.length === 0) return emptyOutcome(`No ${label} rows match the retention rule.`);
    return deleteRows(table, targets, label);
  };
}

/* ─── Broken references (media:<uuid> pointing at missing rows) ─── */

const BROKEN_REF_SOURCES = [
  { table: "projects", fields: "thumbnail,og_image,video_url,images" },
  { table: "blog_posts", fields: "cover_image,og_image" },
  { table: "resources", fields: "cover_image,og_image" },
  { table: "workflow_templates", fields: "thumbnail" },
  { table: "testimonials", fields: "avatar" },
  { table: "resource_collections", fields: "cover_image" },
  { table: "seo_metadata", fields: "og_image" },
  { table: "site_settings", fields: "logo" },
] as const;

/** Returns the broken media refs with every table.field that references them. */
async function findBrokenRefs(): Promise<Map<string, string[]>> {
  const admin = createAdminClient();
  const { data: mediaRows } = await admin.from("media_files").select("id");
  const known = new Set((mediaRows ?? []).map((m: { id: string }) => m.id));
  const broken = new Map<string, string[]>();
  const add = (table: string, field: string, value: unknown) => {
    if (typeof value !== "string") return;
    for (const m of value.matchAll(/media:([0-9a-f-]{36})/g)) {
      if (known.has(m[1])) continue;
      const ref = `media:${m[1]}`;
      const list = broken.get(ref) ?? [];
      if (!list.includes(`${table}.${field}`)) list.push(`${table}.${field}`);
      broken.set(ref, list);
    }
  };
  for (const src of BROKEN_REF_SOURCES) {
    const { data } = await admin.from(src.table as never).select(src.fields);
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      for (const field of src.fields.split(",")) {
        const value = row[field];
        if (Array.isArray(value)) {
          for (const v of value) add(src.table, field, v);
        } else {
          add(src.table, field, value);
        }
      }
    }
  }
  // content_entries stores refs inside JSON — scan the serialized blob.
  const { data: entries } = await admin.from("content_entries").select("content");
  for (const row of (entries ?? []) as { content: unknown }[]) {
    const raw = JSON.stringify(row.content ?? {});
    for (const m of raw.matchAll(/media:([0-9a-f-]{36})/g)) {
      if (known.has(m[1])) continue;
      const ref = `media:${m[1]}`;
      const list = broken.get(ref) ?? [];
      if (!list.includes("content_entries.content")) list.push("content_entries.content");
      broken.set(ref, list);
    }
  }
  return broken;
}

function brokenRefScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const broken = await findBrokenRefs();
      const items: CleanupItem[] = [...broken.entries()].map(([ref, refs]) => ({
        id: ref,
        name: ref,
        detail: `referenced by ${refs.slice(0, 4).join(", ")}${refs.length > 4 ? ` (+${refs.length - 4} more)` : ""}`,
      }));
      return cleanResult(items.length, 0, items.slice(0, SAMPLE_CAP));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

/** Clears broken refs by setting the field to NULL (repair, never delete rows). */
async function repairBrokenRefs(): Promise<CleanupResult> {
  const admin = createAdminClient();
  const broken = await findBrokenRefs();
  const breakdown = new Map<string, number>();
  let repaired = 0;
  for (const [ref, refs] of broken) {
    for (const target of refs) {
      const [table, field] = target.split(".") as [string, string];
      // content_entries refs live in nested JSON — clearing them requires
      // knowing the schema position, so they are reported but not auto-fixed.
      if (table === "content_entries") continue;
      if (field === "images") {
        // array field: pull out the broken refs from every row
        const { data } = await admin.from(table as never).select("id,images");
        for (const row of (data ?? []) as { id: string; images: string[] | null }[]) {
          if (!(row.images ?? []).includes(ref)) continue;
          const { error } = await admin
            .from(table as never)
            .update({ images: (row.images ?? []).filter((i) => i !== ref) } as never)
            .eq("id", row.id);
          if (!error) {
            repaired += 1;
            breakdown.set(`${table}.${field}`, (breakdown.get(`${table}.${field}`) ?? 0) + 1);
          }
        }
        continue;
      }
      const { data } = await admin
        .from(table as never)
        .select("id")
        .eq(field, ref)
        .limit(500);
      const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
      if (ids.length === 0) continue;
      const { error } = await admin
        .from(table as never)
        .update({ [field]: null } as never)
        .in("id", ids);
      if (!error) {
        repaired += ids.length;
        breakdown.set(`${table}.${field}`, (breakdown.get(`${table}.${field}`) ?? 0) + ids.length);
      }
    }
  }
  return {
    deleted: repaired,
    sizeBytes: 0,
    breakdown: [...breakdown.entries()].map(([label, count]) => ({ label, count })),
    message:
      repaired === 0
        ? "No repairable broken references found (JSON refs are reported only)."
        : `Cleared ${repaired} broken media reference(s).`,
  };
}

/* ─── Stale drafts (projects / services / blog posts) ─── */

const DRAFT_TABLES = ["projects", "services", "blog_posts"] as const;

async function fetchDraftRows(): Promise<
  { id: string; title: string; table: string; touched: string }[]
> {
  const admin = createAdminClient();
  const out: { id: string; title: string; table: string; touched: string }[] = [];
  for (const table of DRAFT_TABLES) {
    const { data, error } = await admin.from(table as never).select("id,title,updated_at,status");
    if (error) continue;
    for (const row of (data ?? []) as {
      id: string;
      title: string;
      updated_at: string | null;
      status: string;
    }[]) {
      if (row.status !== "draft") continue;
      out.push({
        id: row.id,
        title: row.title || row.id,
        table,
        touched: row.updated_at ?? "",
      });
    }
  }
  return out;
}

function staleDraftsScan(): () => Promise<ScanResult> {
  return async () => {
    try {
      const drafts = await fetchDraftRows();
      const items: CleanupItem[] = drafts.map((d) => ({
        id: d.id,
        name: d.title,
        detail: `${d.table} · updated ${(d.touched || "?").slice(0, 10)}`,
      }));
      return cleanResult(drafts.length, 0, items.slice(0, SAMPLE_CAP));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : "Scan failed");
    }
  };
}

async function deleteStaleDrafts(request: CleanupRequest | null): Promise<CleanupResult> {
  const admin = createAdminClient();
  const drafts = await fetchDraftRows();
  const cutoff = daysCutoff(request, 90);
  const candidates = drafts.filter((d) => d.touched && d.touched < cutoff);
  if (candidates.length === 0) return emptyOutcome("No stale drafts match the retention rule.");
  const breakdown = new Map<string, number>();
  let deleted = 0;
  for (const table of DRAFT_TABLES) {
    const ids = candidates.filter((c) => c.table === table).map((c) => c.id);
    if (ids.length === 0) continue;
    // Re-verify status='draft' at delete time so a row published since the
    // scan is never removed.
    const { data, error } = await admin
      .from(table as never)
      .delete()
      .in("id", ids)
      .eq("status", "draft")
      .select("id");
    if (error) continue;
    const count = (data ?? []).length;
    deleted += count;
    breakdown.set(table, count);
  }
  return {
    deleted,
    sizeBytes: 0,
    breakdown: [...breakdown.entries()].map(([label, count]) => ({ label, count })),
    message: `Deleted ${deleted} stale draft(s).`,
  };
}

/* ─── Registry ─── */

export const CLEANUP_CATEGORIES: CleanupCategory[] = [
  {
    id: "unused-images",
    title: "Unused images",
    description:
      "Image files uploaded to storage that are not referenced by any project, page, post, template or setting. Verified by scanning every media:<uuid> reference across the CMS.",
    icon: "Image",
    group: "media",
    helpId: "cleanup-unused-images",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep files uploaded in the last N days",
        defaultValue: 0,
        min: 0,
        max: 3650,
        daysLabel: "Grace period (days)",
      },
    ],
    scan: unusedMediaScan("image"),
    cleanup: async (request) => {
      const admin = createAdminClient();
      const used = await getUsedMediaRefs();
      const { data, error } = await admin.from("media_files").select("id,mime_type,created_at");
      if (error) throw new Error(error.message);
      const cutoff = daysCutoff(request, 0);
      const ids = (
        (data ?? []) as {
          id: string;
          mime_type: string | null;
          created_at: string;
        }[]
      )
        .filter(
          (r) =>
            (r.mime_type ?? "").startsWith("image/") &&
            !used.has(`media:${r.id}`) &&
            r.created_at < cutoff,
        )
        .map((r) => r.id);
      if (ids.length === 0) return emptyOutcome("No unused images match the retention rule.");
      return deleteMediaRows(ids, "unused image");
    },
  },
  {
    id: "unused-files",
    title: "Unused files",
    description:
      "Non-image assets (documents, video, audio) that are not referenced anywhere in the CMS.",
    icon: "File",
    group: "media",
    helpId: "cleanup-unused-files",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep files uploaded in the last N days",
        defaultValue: 0,
        min: 0,
        max: 3650,
        daysLabel: "Grace period (days)",
      },
    ],
    scan: unusedMediaScan("non-image"),
    cleanup: async (request) => {
      const admin = createAdminClient();
      const used = await getUsedMediaRefs();
      const { data, error } = await admin.from("media_files").select("id,mime_type,created_at");
      if (error) throw new Error(error.message);
      const cutoff = daysCutoff(request, 0);
      const ids = (
        (data ?? []) as {
          id: string;
          mime_type: string | null;
          created_at: string;
        }[]
      )
        .filter(
          (r) =>
            !(r.mime_type ?? "").startsWith("image/") &&
            !used.has(`media:${r.id}`) &&
            r.created_at < cutoff,
        )
        .map((r) => r.id);
      if (ids.length === 0) return emptyOutcome("No unused files match the retention rule.");
      return deleteMediaRows(ids, "unused file");
    },
  },
  {
    id: "duplicate-media",
    title: "Duplicate media",
    description:
      "Copies that share the exact size and type of a referenced original. Only unreferenced copies are ever removed — the referenced original is never touched.",
    icon: "Copy",
    group: "media",
    helpId: "cleanup-duplicate-media",
    dangerous: false,
    scan: duplicateMediaScan(),
    cleanup: async () => {
      const result = await duplicateMediaScan()();
      if (!result.ok) throw new Error(result.message);
      const admin = createAdminClient();
      const used = await getUsedMediaRefs();
      const { data, error } = await admin
        .from("media_files")
        .select("id,size_bytes,mime_type,created_at");
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as {
        id: string;
        size_bytes: number | null;
        mime_type: string | null;
        created_at: string;
      }[];
      const groups = new Map<string, typeof rows>();
      for (const row of rows) {
        const key = `${row.size_bytes ?? 0}|${row.mime_type ?? ""}`;
        const g = groups.get(key) ?? [];
        g.push(row);
        groups.set(key, g);
      }
      const ids: string[] = [];
      for (const group of groups.values()) {
        if (group.length < 2) continue;
        const hasReferenced = group.some((r) => used.has(`media:${r.id}`));
        if (!hasReferenced) continue;
        for (const row of group) {
          if (!used.has(`media:${row.id}`)) ids.push(row.id);
        }
      }
      if (ids.length === 0) return emptyOutcome("No removable duplicates found.");
      return deleteMediaRows(ids, "duplicate file");
    },
  },
  {
    id: "orphan-objects",
    title: "Orphaned storage objects",
    description:
      "Objects in the media bucket with no matching media_files row (e.g. interrupted uploads). The backups bucket is intentionally excluded.",
    icon: "Archive",
    group: "storage",
    helpId: "cleanup-orphan-objects",
    dangerous: false,
    scan: orphanObjectsScan(),
    cleanup: async () => {
      const admin = createAdminClient();
      const { data: mediaRows } = await admin.from("media_files").select("storage_path");
      const tracked = new Set(
        ((mediaRows ?? []) as { storage_path: string }[]).map((m) => m.storage_path),
      );
      const paths: string[] = [];
      const scanBucket = async (prefix: string): Promise<void> => {
        const { data: files, error } = await admin.storage
          .from(MEDIA_BUCKET)
          .list(prefix, { limit: 1000, offset: 0 });
        if (error) return;
        for (const file of files ?? []) {
          const meta = file.metadata as { size?: number } | null;
          if (meta !== null && typeof meta?.size === "number") {
            if (!tracked.has(`${prefix}${file.name}`)) paths.push(`${prefix}${file.name}`);
          } else {
            await scanBucket(`${prefix}${file.name}/`);
          }
        }
      };
      await scanBucket("");
      if (paths.length === 0) return emptyOutcome("No orphaned storage objects found.");
      const { error } = await admin.storage.from(MEDIA_BUCKET).remove(paths);
      if (error) throw new Error(`Failed to remove objects: ${error.message}`);
      return {
        deleted: paths.length,
        sizeBytes: 0,
        breakdown: [{ label: "storage objects", count: paths.length }],
        message: `Removed ${paths.length} orphaned storage object(s).`,
      };
    },
  },
  {
    id: "empty-buckets",
    title: "Empty storage buckets",
    description:
      "Storage buckets that contain no objects and are not used by the app (media and backups are always kept).",
    icon: "Database",
    group: "storage",
    helpId: "cleanup-empty-buckets",
    dangerous: true,
    scan: emptyBucketScan(),
    cleanup: async () => {
      const admin = createAdminClient();
      const { data: buckets } = await admin.storage.listBuckets();
      let deleted = 0;
      for (const bucket of buckets ?? []) {
        if (RESERVED_BUCKETS.has(bucket.name)) continue;
        const { data: files } = await admin.storage
          .from(bucket.name)
          .list("", { limit: 1, offset: 0 });
        if (!files || files.length > 0) continue;
        const { error } = await admin.storage.deleteBucket(bucket.name);
        if (!error) deleted += 1;
      }
      if (deleted === 0) return emptyOutcome("No empty buckets found.");
      return {
        deleted,
        sizeBytes: 0,
        breakdown: [{ label: "buckets", count: deleted }],
        message: `Deleted ${deleted} empty bucket(s).`,
      };
    },
  },
  {
    id: "old-backup-files",
    title: "Old backup files",
    description:
      "Backup snapshots in the private backups bucket (YYYY-MM-DD folders). Mirrors the nightly cron retention.",
    icon: "HardDrive",
    group: "storage",
    helpId: "cleanup-old-backup-files",
    dangerous: true,
    retention: [
      {
        mode: "keep-days",
        label: "Keep backups newer than N days",
        defaultValue: 30,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
    ],
    scan: oldBackupFilesScan(),
    cleanup: async (request) => {
      const admin = createAdminClient();
      const { data: files } = await admin.storage
        .from(BACKUP_BUCKET)
        .list("", { limit: 1000, offset: 0 });
      const days = request?.mode === "keep-days" ? request.value : 30;
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const folders = (files ?? [])
        .filter((f) => f.name.length === 10 && f.name < cutoff)
        .map((f) => f.name);
      if (folders.length === 0)
        return emptyOutcome("No backup folders older than the retention period.");
      return removeBackupFolders(folders);
    },
  },
  {
    id: "audit-log",
    title: "Old activity log entries",
    description:
      "Append-only audit_log rows (admin actions). Pruning keeps the activity page fast while recent history is preserved.",
    icon: "History",
    group: "logs",
    helpId: "cleanup-audit-log",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep entries newer than N days",
        defaultValue: 90,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N entries",
        defaultValue: 500,
        min: 10,
        max: 100000,
        recordsLabel: "Entries to keep",
      },
      {
        mode: "keep-latest",
        label: "Delete everything except the newest entry",
        defaultValue: 1,
        min: 1,
        max: 1,
      },
    ],
    scan: timestampRowScan("audit_log", "action", "audit log entry"),
    cleanup: timedRowCleanup("audit_log", "audit log", 90),
  },
  {
    id: "login-history",
    title: "Old login history",
    description: "login_history rows recording sign-in attempts. Not needed beyond a few months.",
    icon: "KeyRound",
    group: "logs",
    helpId: "cleanup-login-history",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep entries newer than N days",
        defaultValue: 90,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N entries",
        defaultValue: 200,
        min: 10,
        max: 100000,
        recordsLabel: "Entries to keep",
      },
      {
        mode: "keep-latest",
        label: "Delete everything except the newest entry",
        defaultValue: 1,
        min: 1,
        max: 1,
      },
    ],
    scan: timestampRowScan("login_history", "email", "login"),
    cleanup: timedRowCleanup("login_history", "login history", 90),
  },
  {
    id: "notification-deliveries",
    title: "Old notification logs",
    description:
      "notification_deliveries rows recording every notification delivery attempt (Telegram, etc.).",
    icon: "BellRing",
    group: "logs",
    helpId: "cleanup-notification-deliveries",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep entries newer than N days",
        defaultValue: 30,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N entries",
        defaultValue: 200,
        min: 10,
        max: 100000,
        recordsLabel: "Entries to keep",
      },
      {
        mode: "keep-latest",
        label: "Delete everything except the newest entry",
        defaultValue: 1,
        min: 1,
        max: 1,
      },
    ],
    scan: timestampRowScan("notification_deliveries", "event", "notification"),
    cleanup: timedRowCleanup("notification_deliveries", "notification", 30),
  },
  {
    id: "content-versions",
    title: "Old content versions",
    description:
      "content_versions rows saved on every admin edit. Pruning keeps history bounded; versioning still works for recent edits.",
    icon: "GitCommitHorizontal",
    group: "logs",
    helpId: "cleanup-content-versions",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep versions newer than N days",
        defaultValue: 90,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N versions per entity",
        defaultValue: 10,
        min: 1,
        max: 1000,
        recordsLabel: "Versions per entity",
      },
    ],
    scan: timestampRowScan("content_versions", "entity", "version"),
    cleanup: async (request) => {
      const rows = await fetchTimedRows<{
        id: string;
        created_at: string;
        entity: string;
        entity_id: string;
        version: number;
      }>("content_versions", "id,entity,entity_id,version,created_at");
      let targets: string[];
      if (!request || request.mode === "keep-days") {
        const cutoff = daysCutoff(request, 90);
        targets = rows.filter((r) => r.created_at < cutoff).map((r) => r.id);
      } else if (request.mode === "keep-records") {
        const byEntity = new Map<string, typeof rows>();
        for (const row of rows) {
          const key = `${row.entity}:${row.entity_id}`;
          const g = byEntity.get(key) ?? [];
          g.push(row);
          byEntity.set(key, g);
        }
        targets = [];
        for (const group of byEntity.values()) {
          const sorted = [...group].sort((a, b) => b.version - a.version);
          targets.push(...sorted.slice(request.value).map((r) => r.id));
        }
      } else {
        targets = rows.slice(1).map((r) => r.id);
      }
      if (targets.length === 0)
        return emptyOutcome("No content versions match the retention rule.");
      return deleteRows("content_versions", targets, "content version");
    },
  },
  {
    id: "analytics-events",
    title: "Old analytics events",
    description:
      "analytics_events rows (page views, clicks). The nightly cron already prunes per the analytics retention setting; this applies it manually.",
    icon: "BarChart3",
    group: "content",
    helpId: "cleanup-analytics-events",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep events newer than N days",
        defaultValue: 90,
        min: 7,
        max: 365,
        daysLabel: "Retention (days)",
      },
    ],
    scan: timestampRowScan("analytics_events", "event", "analytics event"),
    cleanup: async (request) => {
      const admin = createAdminClient();
      const { data: settingsRow } = (await admin
        .from("site_settings")
        .select("analytics_config")
        .eq("id", SETTINGS_ROW_ID)
        .maybeSingle()) as unknown as { data: { analytics_config: unknown } | null };
      const analyticsConfig = normalizeAnalyticsConfig(settingsRow?.analytics_config);
      const days =
        request?.mode === "keep-days"
          ? Math.min(request.value, 365)
          : analyticsConfig.retentionDays;
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data, error } = await admin
        .from("analytics_events")
        .delete()
        .lt("created_at", cutoff)
        .select("id");
      if (error) throw new Error(`Failed to delete analytics events: ${error.message}`);
      const count = (data ?? []).length;
      return {
        deleted: count,
        sizeBytes: 0,
        breakdown: [{ label: "analytics events", count }],
        message: `Deleted ${count} analytics event(s) older than ${days} days.`,
      };
    },
  },
  {
    id: "backup-ledger",
    title: "Old backup ledger rows",
    description:
      "backups table rows (nightly backup records from the Vercel cron / GitHub workflow). Only old history is removed.",
    icon: "Save",
    group: "content",
    helpId: "cleanup-backup-ledger",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep rows newer than N days",
        defaultValue: 60,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N rows",
        defaultValue: 10,
        min: 2,
        max: 1000,
        recordsLabel: "Rows to keep",
      },
    ],
    scan: timestampRowScan("backups", "backup_date", "backup ledger row"),
    cleanup: timedRowCleanup("backups", "backup ledger", 60),
  },
  {
    id: "health-checks",
    title: "Old health check records",
    description:
      "health_checks rows recorded by the keep-alive cron. Only recent history is needed by the keep-alive page.",
    icon: "HeartPulse",
    group: "content",
    helpId: "cleanup-health-checks",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep records newer than N days",
        defaultValue: 30,
        min: 7,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N records",
        defaultValue: 60,
        min: 10,
        max: 10000,
        recordsLabel: "Records to keep",
      },
    ],
    scan: timestampRowScan("health_checks", "checked_on", "health check"),
    cleanup: timedRowCleanup("health_checks", "health check", 30),
  },
  {
    id: "broken-refs",
    title: "Broken media references",
    description:
      "media:<uuid> values that point to media files that no longer exist. Cleanup clears the reference (NULL) — no row is ever deleted.",
    icon: "Link2Off",
    group: "references",
    helpId: "cleanup-broken-refs",
    dangerous: false,
    scan: brokenRefScan(),
    cleanup: repairBrokenRefs,
  },
  {
    id: "stale-drafts",
    title: "Stale drafts",
    description:
      "Projects, services and blog posts stuck in draft status. Anything published, featured, or scheduled is never touched — only draft rows untouched for the retention period are candidates.",
    icon: "FileText",
    group: "content",
    helpId: "cleanup-stale-drafts",
    dangerous: true,
    retention: [
      {
        mode: "keep-days",
        label: "Delete drafts untouched for N days",
        defaultValue: 90,
        min: 14,
        max: 3650,
        daysLabel: "Stale after (days)",
      },
    ],
    scan: staleDraftsScan(),
    cleanup: deleteStaleDrafts,
  },
  {
    id: "user-workflows",
    title: "Old user workflows",
    description:
      "user_workflows rows shared from the public playground. Only old user-submitted rows — never the template library.",
    icon: "Workflow",
    group: "content",
    helpId: "cleanup-user-workflows",
    dangerous: false,
    retention: [
      {
        mode: "keep-days",
        label: "Keep workflows newer than N days",
        defaultValue: 365,
        min: 30,
        max: 3650,
        daysLabel: "Retention (days)",
      },
      {
        mode: "keep-records",
        label: "Keep the newest N workflows",
        defaultValue: 100,
        min: 10,
        max: 100000,
        recordsLabel: "Workflows to keep",
      },
    ],
    scan: timestampRowScan("user_workflows", "title", "user workflow"),
    cleanup: timedRowCleanup("user_workflows", "user workflow", 365),
  },
];

const BY_ID = new Map(CLEANUP_CATEGORIES.map((c) => [c.id, c]));

export function getCleanupCategory(id: string): CleanupCategory | undefined {
  return BY_ID.get(id);
}
