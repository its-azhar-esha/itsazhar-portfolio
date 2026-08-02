#!/usr/bin/env node
/**
 * Offsite nightly backup to the git `backups` branch (GitHub Actions).
 *
 * Uses only REST + Storage APIs (no pg_dump), with the service role key.
 * Exports every content table to JSON and downloads every storage file,
 * then prunes to the 30 newest backups. The workflow commits the
 * `backups/` directory and pushes it to the `backups` branch, so the
 * data lives outside Supabase entirely.
 *
 * Secrets (GitHub Actions): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * If either is missing the script exits 0 silently (not configured).
 *
 * Usage: node scripts/backup-to-branch.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("[backup] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping.");
  fs.mkdirSync(path.join(root, "backups"), { recursive: true });
  const readme = path.join(root, "backups", "README.md");
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      `# Backups\n\nOffsite nightlies created by .github/workflows/backup.yml.\n` +
        `This directory is only populated once the SUPABASE_URL and\n` +
        `SUPABASE_SERVICE_ROLE_KEY repository secrets are configured.\n`,
    );
  }
  process.exit(0);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

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

const RETENTION = 30;
const today = new Date().toISOString().slice(0, 10);
const outDir = path.join(root, "backups", today);
const tablesDir = path.join(outDir, "tables");
const storageDir = path.join(outDir, "storage");

let sizeBytes = 0;
let fileCount = 0;

async function rest(pathPart, options = {}) {
  const res = await fetch(`${url}/rest/v1/${pathPart}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`REST ${pathPart} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

const PAGE = 1000;

/** Fetch every row of a table via offset/limit pagination (no truncation). */
async function fetchAllRows(table) {
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await rest(`${table}?select=*&limit=${PAGE}&offset=${offset}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) {
      throw new Error(`REST ${table} returned non-array`);
    }
    rows.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

async function listStorage(bucket, prefix, out) {
  const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  if (!res.ok) {
    throw new Error(`Storage list ${bucket}/${prefix} failed: ${res.status}`);
  }
  const items = await res.json();
  for (const item of items) {
    const metadata = item.metadata;
    if (metadata && typeof metadata.size === "number") {
      out.push({ bucket, path: `${prefix}${item.name}` });
    } else {
      await listStorage(bucket, `${prefix}${item.name}/`, out);
    }
  }
}

async function main() {
  fs.mkdirSync(tablesDir, { recursive: true });

  for (const table of CONTENT_TABLES) {
    const rows = await fetchAllRows(table);
    const json = JSON.stringify(rows, null, 2);
    fs.writeFileSync(path.join(tablesDir, `${table}.json`), json);
    sizeBytes += Buffer.byteLength(json);
    fileCount += 1;
  }

  const bucketRes = await fetch(`${url}/storage/v1/bucket`, { headers });
  if (bucketRes.ok) {
    const buckets = await bucketRes.json();
    const storageFiles = [];
    for (const bucket of buckets) {
      if (bucket.name === "backups") continue;
      await listStorage(bucket.name, "", storageFiles);
    }
    for (const file of storageFiles) {
      const res = await fetch(
        `${url}/storage/v1/object/${file.bucket}/${encodeURI(file.path)}?download=`,
        { headers },
      );
      if (!res.ok) {
        console.warn(`[backup] skip ${file.bucket}/${file.path} (${res.status})`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const dest = path.join(storageDir, file.bucket, ...file.path.split("/"));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buffer);
      sizeBytes += buffer.length;
      fileCount += 1;
    }
  }

  const manifest = {
    date: today,
    tables: CONTENT_TABLES.length,
    files: fileCount,
    sizeBytes,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Prune old backups (keep the 30 newest date folders).
  const backupRoot = path.join(root, "backups");
  const dirs = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse();
  for (const dir of dirs.slice(RETENTION)) {
    fs.rmSync(path.join(backupRoot, dir), { recursive: true, force: true });
  }

  // Record in the Supabase ledger so the DX page shows this backup.
  // Attributed to `github` so it doesn't overwrite the Vercel cron row.
  try {
    await fetch(`${url}/rest/v1/backups?on_conflict=backup_date,source`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        backup_date: today,
        status: "ok",
        table_count: CONTENT_TABLES.length,
        file_count: fileCount,
        size_bytes: sizeBytes,
        manifest,
        updated_at: new Date().toISOString(),
        source: "github",
      }),
    });
  } catch {
    // Ledger write failure is non-fatal for the branch backup.
  }

  console.log(
    `[backup] ok ${today}: ${CONTENT_TABLES.length} tables, ${fileCount} files, ${sizeBytes} bytes`,
  );
}

main().catch((err) => {
  console.error("[backup] failed:", err.message);
  process.exit(1);
});
