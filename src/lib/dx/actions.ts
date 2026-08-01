"use server";

import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { env } from "@/lib/env";
import { SITE_URL } from "@/lib/site";

/* ─── Types ─── */

export type CheckStatus = "ok" | "warn" | "error" | "info";

export interface CheckItem {
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface BucketStatus {
  name: string;
  public: boolean;
  objects: number;
  sizeBytes: number;
}

export interface TableStatus {
  name: string;
  rows: number;
}

export interface BrokenRef {
  entity: string;
  field: string;
  value: string;
}

export interface SeoEntry {
  entity: string;
  issues: string[];
  score: number; // 0-100
}

export interface LinkStatus {
  url: string;
  label: string;
  status: "ok" | "broken" | "error" | "skipped";
  statusCode?: number;
}

export interface DxReport {
  environment: CheckItem[];
  health: CheckItem[];
  migrationStatus: {
    local: string[];
    applied: string[];
    pending: string[];
    unknown: string[];
    ok: boolean;
  };
  storage: {
    buckets: BucketStatus[];
    totalObjects: number;
    totalBytes: number;
    ok: boolean;
  };
  database: {
    tables: TableStatus[];
    ok: boolean;
  };
  brokenRefs: {
    total: number;
    items: BrokenRef[];
  };
  seo: SeoEntry[];
  links: {
    total: number;
    ok: number;
    broken: LinkStatus[];
    checked: number;
  };
}

const MEDIA_REF = /media:([0-9a-f-]{36})/gi;

/* ─── Helpers ─── */

/* ─── Report ─── */

export async function getDxReportAction(): Promise<Result<DxReport>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const environment: CheckItem[] = [];
    const health: CheckItem[] = [];

    /* Environment checker */
    environment.push({
      label: "Supabase URL",
      status: env.hasSupabase ? "ok" : "error",
      detail: env.hasSupabase ? `${env.supabaseUrl}` : "NEXT_PUBLIC_SUPABASE_URL is missing",
    });
    environment.push({
      label: "Anon key",
      status: env.supabaseAnonKey ? "ok" : "error",
      detail: env.supabaseAnonKey ? `${env.supabaseAnonKey.slice(0, 12)}…` : "Missing anon key",
    });
    environment.push({
      label: "Service role key",
      status: env.supabaseServiceRoleKey ? "ok" : "error",
      detail: env.supabaseServiceRoleKey
        ? `${env.supabaseServiceRoleKey.slice(0, 12)}… (server-only)`
        : "Missing SUPABASE_SERVICE_ROLE_KEY",
    });
    environment.push({
      label: "AI provider",
      status: env.hasAI ? "ok" : "warn",
      detail: env.hasAI
        ? `${env.hasGroq ? "Groq" : ""}${env.hasGroq && env.hasOpenRouter ? " + " : ""}${env.hasOpenRouter ? "OpenRouter" : ""}`
        : "No GROQ_API_KEY / OPENROUTER_API_KEY",
    });
    environment.push({
      label: "Site URL",
      status: SITE_URL ? "ok" : "warn",
      detail: SITE_URL || "SITE_URL not set",
    });

    /* Health monitor (database + storage reachability) */
    try {
      const start = Date.now();
      const dbRes = await admin.from("blog_posts").select("id").limit(1).maybeSingle();
      const dbLatencyMs = Date.now() - start;
      health.push({
        label: "Database",
        status: dbRes.data ? "ok" : "error",
        detail: dbRes.data ? `Responded in ${dbLatencyMs}ms` : `No response (${dbLatencyMs}ms)`,
      });
    } catch (err) {
      health.push({
        label: "Database",
        status: "error",
        detail: err instanceof Error ? err.message : "Unreachable",
      });
    }
    try {
      const start = Date.now();
      const storageRes = await admin.storage.listBuckets();
      const storageLatencyMs = Date.now() - start;
      const bucketCount = storageRes.data?.length ?? 0;
      health.push({
        label: "Storage API",
        status: storageRes.error ? "error" : "ok",
        detail: storageRes.error
          ? storageRes.error.message
          : `${bucketCount} bucket(s) reachable in ${storageLatencyMs}ms`,
      });
    } catch (err) {
      health.push({
        label: "Storage API",
        status: "error",
        detail: err instanceof Error ? err.message : "Unreachable",
      });
    }

    /* Migration status */
    const localMigrations: string[] = [];
    try {
      const dir = path.join(process.cwd(), "supabase", "migrations");
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
      localMigrations.push(...files.sort());
    } catch {
      // Migrations folder unavailable (e.g. deployed without repo files).
    }
    const { data: appliedRows } = await admin.rpc("list_applied_migrations" as never);
    const applied = ((appliedRows ?? []) as { version: string; name: string }[]).map(
      (r) => `${r.version}_${r.name}.sql`,
    );
    const appliedSet = new Set(applied);
    const localSet = new Set(localMigrations);
    const pending = localMigrations.filter((m) => !appliedSet.has(m));
    const unknown = applied.filter((m) => !localSet.has(m));

    /* Storage status */
    const buckets: BucketStatus[] = [];
    let totalObjects = 0;
    let totalBytes = 0;
    try {
      const { data: bucketList } = await admin.storage.listBuckets();
      for (const bucket of bucketList ?? []) {
        let objects = 0;
        let size = 0;
        try {
          const { data: files, error } = await admin.storage
            .from(bucket.name)
            .list("", { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
          if (!error) {
            objects = files.length;
            for (const file of files) {
              size += (file.metadata as { size?: number }).size ?? 0;
            }
          }
        } catch {
          // Bucket listing failed; report zeros.
        }
        totalObjects += objects;
        totalBytes += size;
        buckets.push({ name: bucket.name, public: bucket.public, objects, sizeBytes: size });
      }
    } catch (err) {
      logError("dx storage status failed", {
        message: err instanceof Error ? err.message : err,
      });
    }

    /* Database status (row counts) */
    const tableNames = [
      "projects",
      "services",
      "blog_posts",
      "resources",
      "resource_files",
      "workflow_templates",
      "workflow_node_types",
      "user_workflows",
      "leads",
      "media_files",
      "content_entries",
      "seo_metadata",
      "testimonials",
      "case_studies",
      "site_settings",
      "analytics_events",
    ];
    const tables: TableStatus[] = [];
    for (const name of tableNames) {
      try {
        const { count } = await admin
          .from(name as never)
          .select("id", { count: "exact", head: true });
        tables.push({ name, rows: count ?? 0 });
      } catch {
        tables.push({ name, rows: -1 });
      }
    }

    /* Broken reference detector */
    const { data: mediaFiles } = await admin.from("media_files").select("id");
    const knownIds = new Set((mediaFiles ?? []).map((m: { id: string }) => m.id));
    const brokenRefs: BrokenRef[] = [];
    const scans: { entity: string; rows: { field: string; value: string | null }[] }[] = [];

    const { data: projectRows } = await admin.from("projects").select("thumbnail,images,og_image");
    scans.push({
      entity: "projects",
      rows: (projectRows ?? []).flatMap(
        (r: { thumbnail: string | null; images: string[] | null; og_image: string | null }) => [
          { field: "thumbnail", value: r.thumbnail },
          { field: "og_image", value: r.og_image },
          ...(r.images ?? []).map((v: string) => ({ field: "images", value: v })),
        ],
      ),
    });
    const { data: blogRows } = await admin.from("blog_posts").select("cover_image,og_image");
    scans.push({
      entity: "blog_posts",
      rows: (blogRows ?? []).flatMap(
        (r: { cover_image: string | null; og_image: string | null }) => [
          { field: "cover_image", value: r.cover_image },
          { field: "og_image", value: r.og_image },
        ],
      ),
    });
    const { data: resourceRows } = await admin.from("resources").select("cover_image,og_image");
    scans.push({
      entity: "resources",
      rows: (resourceRows ?? []).flatMap(
        (r: { cover_image: string | null; og_image: string | null }) => [
          { field: "cover_image", value: r.cover_image },
          { field: "og_image", value: r.og_image },
        ],
      ),
    });
    const { data: templateRows } = await admin.from("workflow_templates").select("thumbnail");
    scans.push({
      entity: "workflow_templates",
      rows: (templateRows ?? []).map((r: { thumbnail: string | null }) => ({
        field: "thumbnail",
        value: r.thumbnail,
      })),
    });

    for (const scan of scans) {
      for (const row of scan.rows) {
        if (!row.value) continue;
        for (const match of row.value.matchAll(MEDIA_REF)) {
          if (!knownIds.has(match[1])) {
            brokenRefs.push({ entity: scan.entity, field: row.field, value: row.value });
          }
        }
      }
    }

    /* SEO validator (blog posts + settings) */
    const seo: SeoEntry[] = [];
    const { data: posts } = await admin
      .from("blog_posts")
      .select(
        "title,excerpt,seo_title,seo_description,keywords,og_image,canonical_url,slug,status",
      );
    for (const post of (posts ?? []) as {
      title: string;
      excerpt: string;
      seo_title: string | null;
      seo_description: string | null;
      keywords: string[] | null;
      og_image: string | null;
      canonical_url: string | null;
      slug: string;
      status: string;
    }[]) {
      if (post.status !== "published") continue;
      const issues: string[] = [];
      if (!post.seo_title) issues.push("No custom SEO title (uses article title)");
      else if (post.seo_title.length > 70)
        issues.push(`SEO title too long (${post.seo_title.length} chars)`);
      if (!post.seo_description) issues.push("Missing meta description");
      else if (post.seo_description.length > 160)
        issues.push(`Meta description too long (${post.seo_description.length} chars)`);
      else if (post.seo_description.length < 120) issues.push("Meta description under 120 chars");
      if (!post.keywords || post.keywords.length < 3) issues.push("Fewer than 3 keywords");
      if (!post.og_image) issues.push("No Open Graph image");
      if (!post.canonical_url) issues.push("No canonical URL");
      if (!post.excerpt) issues.push("Missing excerpt");
      seo.push({
        entity: post.title,
        issues,
        score: Math.max(0, 100 - issues.length * 14),
      });
    }
    {
      const { data: settings } = await admin.from("site_settings").select("*").maybeSingle();
      const issues: string[] = [];
      const s = (settings ?? {}) as {
        site_name?: string | null;
        site_description?: string | null;
        booking_url?: string | null;
      };
      if (!s.site_name) issues.push("Site name missing");
      if (!s.site_description) issues.push("Site description missing");
      if (!s.booking_url) issues.push("Booking URL missing");
      seo.push({
        entity: "Site settings",
        issues,
        score: Math.max(0, 100 - issues.length * 33),
      });
    }

    /* Link checker */
    const linksToCheck: { url: string; label: string }[] = [];
    const { data: settingsRow } = await admin.from("site_settings").select("*").maybeSingle();
    const settings = (settingsRow ?? {}) as Record<string, string | null>;
    const settingsUrls: [string, string][] = [
      ["booking_url", "Booking URL"],
      ["social_github", "GitHub"],
      ["social_linkedin", "LinkedIn"],
      ["social_twitter", "X/Twitter"],
      ["social_fiverr", "Fiverr"],
      ["social_instagram", "Instagram"],
      ["social_youtube", "YouTube"],
    ];
    for (const [key, label] of settingsUrls) {
      if (settings[key]) linksToCheck.push({ url: settings[key] as string, label });
    }
    const { data: resourceRows2 } = await admin.from("resources").select("title,pricing");
    for (const r of (resourceRows2 ?? []) as { title: string; pricing: unknown }[]) {
      const pricing = (r.pricing ?? {}) as { purchase_url?: string };
      if (pricing.purchase_url) {
        linksToCheck.push({ url: pricing.purchase_url, label: `Resource: ${r.title}` });
      }
    }
    const { data: projectRows2 } = await admin.from("projects").select("title,demo_url,github_url");
    for (const p of (projectRows2 ?? []) as {
      title: string;
      demo_url: string | null;
      github_url: string | null;
    }[]) {
      if (p.demo_url) linksToCheck.push({ url: p.demo_url, label: `Project demo: ${p.title}` });
      if (p.github_url) linksToCheck.push({ url: p.github_url, label: `Project repo: ${p.title}` });
    }

    const links: LinkStatus[] = [];
    let okCount = 0;
    for (const item of linksToCheck.slice(0, 25)) {
      let result: LinkStatus;
      try {
        const res = await fetch(item.url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
        });
        result = {
          url: item.url,
          label: item.label,
          status: res.ok ? "ok" : "broken",
          statusCode: res.status,
        };
      } catch {
        try {
          const res = await fetch(item.url, {
            redirect: "follow",
            signal: AbortSignal.timeout(8000),
          });
          result = {
            url: item.url,
            label: item.label,
            status: res.ok ? "ok" : "broken",
            statusCode: res.status,
          };
        } catch {
          result = { url: item.url, label: item.label, status: "error" };
        }
      }
      if (result.status === "ok") okCount += 1;
      links.push(result);
    }

    return ok({
      environment,
      health,
      migrationStatus: {
        local: localMigrations,
        applied,
        pending,
        unknown,
        ok: pending.length === 0,
      },
      storage: {
        buckets,
        totalObjects,
        totalBytes,
        ok: totalObjects === 0 && buckets.length === 0 ? false : true,
      },
      database: {
        tables,
        ok: tables.every((t) => t.rows >= 0),
      },
      brokenRefs: {
        total: brokenRefs.length,
        items: brokenRefs.slice(0, 20),
      },
      seo,
      links: {
        total: links.length,
        ok: okCount,
        broken: links.filter((l) => l.status !== "ok"),
        checked: links.length,
      },
    });
  } catch (err) {
    logError("getDxReportAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to run DX report");
  }
}
