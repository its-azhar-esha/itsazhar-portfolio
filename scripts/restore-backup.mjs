#!/usr/bin/env node
/**
 * Restore a backup produced by /api/backup (Supabase `backups` bucket)
 * or by scripts/backup-to-branch.mjs (local git checkout).
 *
 * Usage:
 *   node scripts/restore-backup.mjs --source=storage --date=2026-08-01
 *   node scripts/restore-backup.mjs --source=local  --path=backups/2026-08-01
 *   node scripts/restore-backup.mjs --source=local  --path=backups/2026-08-01 --dry-run
 *
 * Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role required —
 *      restores upsert into every table and re-upload storage files).
 *
 * WARNING: restores are destructive upserts by primary key. Use
 * --dry-run first to see what would be written.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  }),
);

const source = args.source ?? "local";
const dryRun = args["dry-run"] === "true" || args["dry-run"] === "1";
const isStorage = source === "storage";

function resolveLocal(dir) {
  return path.resolve(dir.includes(path.sep) ? dir : path.join(root, dir));
}

async function storageList(prefix) {
  const res = await fetch(`${url}/storage/v1/object/list/backups`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  if (!res.ok) throw new Error(`Storage list failed: ${res.status}`);
  return res.json();
}

async function storageDownload(pathPart) {
  const res = await fetch(`${url}/storage/v1/object/backups/${encodeURI(pathPart)}?download=`, {
    headers,
  });
  if (!res.ok) throw new Error(`Download ${pathPart} failed: ${res.status}`);
  return res.arrayBuffer();
}

async function readTable(name, baseDir) {
  if (isStorage) {
    const buf = await storageDownload(`${baseDir}tables/${name}.json`);
    return JSON.parse(Buffer.from(buf).toString("utf-8"));
  }
  const file = path.join(baseDir, "tables", `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

async function main() {
  let baseDir;
  if (isStorage) {
    const date = args.date;
    if (!date) {
      console.error("--date=YYYY-MM-DD is required for storage source.");
      process.exit(1);
    }
    baseDir = `${date}/`;
  } else {
    baseDir = resolveLocal(args.path ?? "backups");
    if (!fs.existsSync(baseDir)) {
      console.error(`Local backup dir not found: ${baseDir}`);
      process.exit(1);
    }
  }

  const tables = fs.existsSync(path.join(baseDir, "tables"))
    ? fs
        .readdirSync(path.join(baseDir, "tables"))
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
    : (await storageList(`${baseDir}tables/`))
        .filter((f) => f.metadata && typeof f.metadata.size === "number")
        .map((f) => f.name.replace(/\.json$/, ""));

  let restored = 0;
  let skipped = 0;

  for (const table of tables) {
    const rows = await readTable(table, baseDir);
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`  - ${table}: empty, skipped`);
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(`  - ${table}: would restore ${rows.length} row(s)`);
      restored += 1;
      continue;
    }
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=id`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`  - ${table}: FAILED (${res.status}) ${body.slice(0, 300)}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`  + ${table}: restored ${rows.length} row(s)`);
    restored += 1;
  }

  // Storage files (only from local source; storage source files live
  // in the same project and are restored by the tables above).
  if (!isStorage && !dryRun) {
    const storageRoot = path.join(baseDir, "storage");
    if (fs.existsSync(storageRoot)) {
      for (const bucket of fs.readdirSync(storageRoot)) {
        const bucketRoot = path.join(storageRoot, bucket);
        await ensureBucket(bucket);
        const walk = async (dir) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await walk(full);
            } else {
              const rel = path.relative(bucketRoot, full).replace(/\\/g, "/");
              const buf = fs.readFileSync(full);
              await uploadStorage(bucket, rel, buf);
              console.log(`  + storage ${bucket}/${rel} (${buf.length} bytes)`);
            }
          }
        };
        await walk(bucketRoot);
      }
    }
  }

  console.log(
    dryRun
      ? `DRY RUN complete: ${restored} table(s) ready, ${skipped} empty.`
      : `Restore complete: ${restored} table(s) restored, ${skipped} empty.`,
  );
}

async function ensureBucket(bucket) {
  const res = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers });
  if (res.status === 404) {
    await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: bucket, name: bucket, public: false }),
    });
  }
}

async function uploadStorage(bucket, rel, buffer) {
  await fetch(`${url}/storage/v1/object/${bucket}/${encodeURI(rel)}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/octet-stream",
      "x-upsert": "true",
    },
    body: buffer,
  });
}

main().catch((err) => {
  console.error("Restore failed:", err.message);
  process.exit(1);
});
