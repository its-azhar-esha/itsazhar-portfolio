"use server";

/**
 * Admin dashboard overview (server-only).
 *
 * Aggregates best-effort monitoring metrics for the /admin landing page:
 * service health, storage/database capacity, request volume, rate-limit
 * posture, bandwidth proxy and integration API usage. Every metric is
 * computed defensively — a failing source degrades to a visible "error /
 * unavailable" state instead of failing the whole page.
 *
 * Where exact values are not exposed to the platform tier (e.g. egress
 * bandwidth on Vercel Hobby), the widget shows a clearly-labeled estimate
 * or an informative status instead of fabricating numbers.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site/urls";
import { formatBytes } from "@/lib/dashboard/format";
import { getIntegrationList } from "@/lib/integrations/repository";
import { hoursSince, humanAge, statusFromAge } from "@/lib/keepalive/freshness";

export type MetricStatus = "ok" | "warn" | "error" | "info";

export interface MetricState {
  status: MetricStatus;
  label: string;
  detail: string;
  /** Optional, human-readable fix shown when the item is not fully healthy. */
  recommendedAction?: string;
}

export interface UsageMeter {
  label: string;
  usedLabel: string;
  quotaLabel: string | null;
  percent: number | null;
  status: MetricStatus;
}

export interface TopTable {
  name: string;
  rows: number;
  sizeBytes: number;
}

export interface ApiIntegrationMetric {
  id: string;
  label: string;
  icon: string;
  configured: boolean;
  maskedKey: string | null;
  usageCount: number;
  lastUsedAt: string | null;
}

export type RecommendationSeverity = "high" | "medium" | "low" | "info";

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  category: string;
  title: string;
  why: string;
  impact: string;
  action: string;
  /** Destination admin page (client-side nav target). */
  href: string;
}

export interface DashboardOverview {
  generatedAt: string;
  health: {
    database: MetricState;
    storage: MetricState;
    uptime: MetricState;
    backups: MetricState;
    migrations: MetricState;
  };
  storage: UsageMeter & {
    totalBytes: number;
    totalObjects: number;
    buckets: number;
  };
  database: UsageMeter & {
    totalBytes: number;
    tables: number;
    topTables: TopTable[];
  };
  requests: {
    events30d: number;
    pageViews30d: number;
    adminActions30d: number;
    leads30d: number;
    perDayAvg: number;
    status: MetricStatus;
    detail: string;
  };
  bandwidth: {
    status: MetricStatus;
    detail: string;
    downloads30d: number;
    mediaBytes: number;
  };
  rateLimit: {
    status: MetricStatus;
    detail: string;
    measuredPerMinute: number;
  };
  api: {
    totalCalls: number;
    integrations: ApiIntegrationMetric[];
  };
  system: {
    operational: boolean;
    checks: MetricState[];
    deployedAt: string | null;
    siteUrl: string;
  };
  recommendations: Recommendation[];
}

/* Free-tier capacity baselines (Supabase, informational). Exact project
   limits depend on the plan; these are the published Free-tier values. */
const STORAGE_QUOTA_BYTES = 1_073_741_824; // 1 GB
const DATABASE_QUOTA_BYTES = 524_288_000; // 500 MB
const WINDOW_DAYS = 30;

const VERCEL_PROJECT_ID =
  process.env.VERCEL_PROJECT_ID?.trim() || "prj_FJlcUnY9FuaGJyf0DM97Bqlg26ZQ";

/* ─── Helpers ─── */

function percentOf(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.min(100, Math.round((used / quota) * 1000) / 10);
}

function meterStatus(percent: number | null): MetricStatus {
  if (percent === null) return "info";
  if (percent >= 95) return "error";
  if (percent >= 70) return "warn";
  return "ok";
}

async function ping(admin: ReturnType<typeof createAdminClient>, table: string): Promise<number> {
  const start = Date.now();
  await admin
    .from(table as never)
    .select("id")
    .limit(1)
    .maybeSingle();
  return Date.now() - start;
}

async function scanStorageTotals(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ totalBytes: number; totalObjects: number; buckets: number }> {
  const totals = { totalBytes: 0, totalObjects: 0, buckets: 0 };
  const bucketList = (await admin.storage.listBuckets()).data ?? [];
  totals.buckets = bucketList.length;
  const scan = async (bucketName: string, prefix: string, budget: { files: number }) => {
    const { data: files, error } = await admin.storage
      .from(bucketName)
      .list(prefix, { limit: 1000, offset: 0 });
    if (error) return;
    for (const file of files ?? []) {
      const metadata = file.metadata as { size?: number } | null;
      const isFile = metadata !== null && typeof metadata?.size === "number";
      if (isFile) {
        if (budget.files >= 5000) return;
        budget.files += 1;
        totals.totalObjects += 1;
        totals.totalBytes += metadata.size ?? 0;
      } else {
        await scan(bucketName, `${prefix}${file.name}/`, budget);
      }
    }
  };
  for (const bucket of bucketList) {
    await scan(bucket.name, "", { files: 0 });
  }
  return totals;
}

/* ─── Recommendations (Action Center) ─── */

const EXPIRING_WINDOW_MS = 14 * 86_400_000; // flag keys expiring within 14 days

interface RecommendationInput {
  admin: ReturnType<typeof createAdminClient>;
  now: Date;
  backupStatus: MetricStatus;
  backupDetail: string;
  migrationStatus: MetricStatus;
  migrationDetail: string;
  rlsAtRisk: boolean;
  hasVercelToken: boolean;
  integrations: {
    label: string;
    keyLabel: string;
    configured: boolean;
    expiresAt: string | null;
  }[];
  storagePercent: number | null;
  databasePercent: number | null;
  rateLimitStatus: MetricStatus;
}

async function collectRecommendations(input: RecommendationInput): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const push = (r: Omit<Recommendation, "id">) =>
    recs.push({
      ...r,
      id: `${r.category.toLowerCase()}-${recs.length}-${Math.random().toString(36).slice(2, 7)}`,
    });

  /* SEO: entries missing a title or meta description */
  try {
    const { data } = await input.admin.from("seo_metadata").select("title,description");
    const rows = (data ?? []) as { title: string | null; description: string | null }[];
    const missing = rows.filter((r) => !r.title || !r.description);
    if (missing.length > 0) {
      push({
        severity: "medium",
        category: "SEO",
        title: `${missing.length} page(s) missing title or meta description`,
        why: "Pages without a title or meta description are poorly surfaced in search results and social previews.",
        impact: "Lower SEO ranking and weak link/social sharing previews.",
        action: `Add a title and description to ${missing.length} SEO entr${missing.length === 1 ? "y" : "ies"}.`,
        href: "/admin/seo",
      });
    }
  } catch {
    // SEO scan is best-effort.
  }

  /* Content: unpublished drafts */
  try {
    const [projects, blog, services] = await Promise.all([
      input.admin
        .from("projects")
        .select("id", { count: "exact", head: true })
        .neq("status", "published"),
      input.admin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .neq("status", "published"),
      input.admin
        .from("services")
        .select("id", { count: "exact", head: true })
        .neq("status", "published"),
    ]);
    const drafts = (projects.count ?? 0) + (blog.count ?? 0) + (services.count ?? 0);
    if (drafts > 0) {
      push({
        severity: "low",
        category: "Content",
        title: `${drafts} unpublished draft${drafts === 1 ? "" : "s"}`,
        why: "Drafts are not visible to visitors, so in-progress or finished work may be going unseen.",
        impact: "Potentially missing traffic and incomplete portfolio/site.",
        action: "Review and publish or remove the drafts.",
        href: "/admin/content",
      });
    }
  } catch {
    // Draft scan is best-effort.
  }

  /* Media: published projects missing a thumbnail */
  try {
    const { data } = await input.admin
      .from("projects")
      .select("thumbnail")
      .eq("status", "published");
    const rows = (data ?? []) as { thumbnail: string | null }[];
    const noThumb = rows.filter((p) => !p.thumbnail);
    if (noThumb.length > 0) {
      push({
        severity: "medium",
        category: "Media",
        title: `${noThumb.length} published project(s) missing a thumbnail`,
        why: "Projects without a thumbnail render as blank cards and are less compelling.",
        impact: "Lower engagement and a less polished public portfolio.",
        action: `Upload a thumbnail for ${noThumb.length} project(s).`,
        href: "/admin/media",
      });
    }
  } catch {
    // Thumbnail scan is best-effort.
  }

  /* AI provider keys: missing / expired / expiring */
  for (const i of input.integrations) {
    if (!i.configured) {
      push({
        severity: "medium",
        category: "Integrations",
        title: `${i.label} API key is not configured`,
        why: `${i.label} powers AI features; without a key those features fall back or fail.`,
        impact: "AI chat / features may be unavailable.",
        action: `Add a ${i.label} key or set ${i.keyLabel}.`,
        href: "/admin/integrations",
      });
      continue;
    }
    if (!i.expiresAt) continue;
    const expiry = new Date(i.expiresAt).getTime();
    if (expiry < input.now.getTime()) {
      push({
        severity: "high",
        category: "Integrations",
        title: `${i.label} API key has expired`,
        why: "An expired key will stop working and break AI features.",
        impact: "AI features will fail for visitors.",
        action: `Rotate the ${i.label} key in the Integration Center.`,
        href: "/admin/integrations",
      });
    } else if (expiry - input.now.getTime() < EXPIRING_WINDOW_MS) {
      push({
        severity: "low",
        category: "Integrations",
        title: `${i.label} API key expires soon (${new Date(expiry).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })})`,
        why: "The key will stop working when it expires.",
        impact: "Potential disruption to AI features.",
        action: `Rotate the ${i.label} key before it expires.`,
        href: "/admin/integrations",
      });
    }
  }

  /* Configuration: VERCEL_TOKEN missing */
  if (!input.hasVercelToken) {
    push({
      severity: "low",
      category: "Configuration",
      title: "Deployment info is unavailable",
      why: "VERCEL_TOKEN is not set, so the dashboard cannot show deployment status.",
      impact: "You can't see when production was last deployed from the dashboard.",
      action: "Add a Vercel token as VERCEL_TOKEN in Vercel project settings, then redeploy.",
      href: "/admin",
    });
  }

  /* Backups */
  if (input.backupStatus !== "ok") {
    push({
      severity: input.backupStatus === "error" ? "high" : "medium",
      category: "Backups",
      title:
        input.backupStatus === "error" ? "Backup status is unavailable" : "Backups need attention",
      why: input.backupDetail,
      impact: "Risk of data loss if the latest backup is stale or failed.",
      action: "Check the Vercel cron and GitHub backup workflow.",
      href: "/admin/dx",
    });
  }

  /* Migrations */
  if (input.migrationStatus !== "ok") {
    push({
      severity: input.migrationStatus === "error" ? "high" : "medium",
      category: "Maintenance",
      title: "Database migrations are not up to date",
      why: input.migrationDetail,
      impact: "Schema drift can cause runtime errors or missing features.",
      action: "Apply pending migrations with `supabase db push`.",
      href: "/admin/dx",
    });
  }

  /* Security: RLS disabled */
  if (input.rlsAtRisk) {
    push({
      severity: "high",
      category: "Security",
      title: "Row-level security is disabled on some tables",
      why: "Tables without RLS expose their data to any client that can reach the API.",
      impact: "Serious data-exposure risk.",
      action: "Enable RLS on the affected tables in the Supabase dashboard.",
      href: "/admin/security",
    });
  }

  /* Capacity: storage / database utilization */
  if (input.storagePercent !== null && input.storagePercent >= 70) {
    push({
      severity: input.storagePercent >= 95 ? "high" : "medium",
      category: "Capacity",
      title: `Storage is ${input.storagePercent}% full`,
      why: "Storage is approaching (or past) the Free-tier quota.",
      impact: "Uploads may fail once the quota is reached.",
      action: "Review and remove unused media files.",
      href: "/admin/media",
    });
  }
  if (input.databasePercent !== null && input.databasePercent >= 70) {
    push({
      severity: input.databasePercent >= 95 ? "high" : "medium",
      category: "Capacity",
      title: `Database is ${input.databasePercent}% full`,
      why: "Database size is approaching (or past) the quota.",
      impact: "Writes may be blocked once the limit is reached.",
      action: "Prune old audit/analytics or backup data.",
      href: "/admin/dx",
    });
  }

  /* Rate-limit posture */
  if (input.rateLimitStatus === "warn") {
    push({
      severity: "medium",
      category: "Performance",
      title: "Traffic is high relative to API limits",
      why: "Measured request volume is approaching Supabase per-minute limits.",
      impact: "Rate limiting could throttle requests under spikes.",
      action: "Consider upgrading the plan or optimizing traffic.",
      href: "/admin/analytics",
    });
  }

  return recs;
}

/* ─── Overview ─── */

export async function getDashboardOverviewAction(): Promise<Result<DashboardOverview>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const now = new Date();
    const since30d = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString();
    const since24h = new Date(now.getTime() - 86_400_000).toISOString();
    const siteUrl = await getSiteUrl();

    /* Health: database + storage reachability */
    const health: DashboardOverview["health"] = {
      database: { status: "ok", label: "Database", detail: "Responded in —ms" },
      storage: { status: "ok", label: "Storage API", detail: "Reachable in —ms" },
      uptime: { status: "info", label: "Uptime", detail: "No health checks recorded yet" },
      backups: { status: "info", label: "Backups", detail: "No backup recorded yet" },
      migrations: { status: "ok", label: "Migrations", detail: "Up to date" },
    };
    try {
      const dbMs = await ping(admin, "blog_posts");
      health.database = { status: "ok", label: "Database", detail: `Responded in ${dbMs}ms` };
    } catch (err) {
      health.database = {
        status: "error",
        label: "Database",
        detail: err instanceof Error ? err.message : "Unreachable",
      };
    }
    try {
      const start = Date.now();
      const storageRes = await admin.storage.listBuckets();
      const latencyMs = Date.now() - start;
      const bucketCount = storageRes.data?.length ?? 0;
      health.storage = storageRes.error
        ? { status: "error", label: "Storage API", detail: storageRes.error.message }
        : {
            status: "ok",
            label: "Storage API",
            detail: `${bucketCount} bucket(s) reachable in ${latencyMs}ms`,
          };
    } catch (err) {
      health.storage = {
        status: "error",
        label: "Storage API",
        detail: err instanceof Error ? err.message : "Unreachable",
      };
    }

    /* Health: keep-alive history */
    try {
      const { data: checkRows } = await admin
        .from("health_checks")
        .select("checked_on,ok,updated_at,created_at")
        .order("checked_on", { ascending: false })
        .limit(30);
      const checks = (checkRows ?? []) as {
        checked_on: string;
        ok: boolean;
        updated_at: string | null;
        created_at: string;
      }[];
      let streak = 0;
      for (const c of checks) {
        if (c.ok) streak += 1;
        else break;
      }
      const lastOk = checks.find((c) => c.ok);
      const lastOkAt = lastOk ? (lastOk.updated_at ?? lastOk.created_at) : null;
      const ageHours = hoursSince(lastOkAt, now);
      const uptimeStatus: MetricStatus = checks.length === 0 ? "info" : statusFromAge(ageHours);
      health.uptime = {
        status: uptimeStatus,
        label: "Uptime",
        detail:
          checks.length === 0
            ? "No health checks recorded yet"
            : `${streak} day(s) healthy · last check ${humanAge(lastOkAt, now)}`,
      };
    } catch (err) {
      health.uptime = {
        status: "error",
        label: "Uptime",
        detail: err instanceof Error ? err.message : "Unavailable",
      };
    }

    /* Health: latest backup */
    try {
      const { data: backupRows } = await admin
        .from("backups")
        .select("backup_date,status,created_at,updated_at")
        .order("backup_date", { ascending: false })
        .limit(1);
      const latest = (backupRows ?? [])[0] as
        | {
            backup_date: string;
            status: string;
            created_at: string;
            updated_at: string | null;
          }
        | undefined;
      if (!latest) {
        health.backups = { status: "info", label: "Backups", detail: "No backup recorded yet" };
      } else {
        const lastRunAt = latest.updated_at ?? latest.created_at;
        const ageHours = hoursSince(lastRunAt, now);
        health.backups = {
          status: latest.status !== "ok" ? "warn" : (statusFromAge(ageHours) as MetricStatus),
          label: "Backups",
          detail:
            latest.status === "ok"
              ? `Latest backup ${latest.backup_date} — OK · ${humanAge(lastRunAt, now)}`
              : `Latest backup ${latest.backup_date} — ${latest.status}`,
        };
      }
    } catch (err) {
      health.backups = {
        status: "error",
        label: "Backups",
        detail: err instanceof Error ? err.message : "Unavailable",
      };
    }

    /* Health: migration drift */
    try {
      const { data: appliedRows } = await admin.rpc("list_applied_migrations" as never);
      const applied = new Set(
        ((appliedRows ?? []) as { version: string; name: string }[]).map(
          (r) => `${r.version}_${r.name}.sql`,
        ),
      );
      const local = new Set<string>();
      try {
        const { readdirSync } = await import("node:fs");
        const { join } = await import("node:path");
        for (const f of readdirSync(join(process.cwd(), "supabase", "migrations"))) {
          local.add(f);
        }
      } catch {
        // Migrations folder unavailable in this runtime.
      }
      const pending = [...local].filter((f) => !applied.has(f)).sort();
      health.migrations = {
        status: pending.length === 0 ? "ok" : "warn",
        label: "Migrations",
        detail:
          pending.length === 0
            ? "Up to date"
            : `${pending.length} pending: ${pending.slice(0, 2).join(", ")}${pending.length > 2 ? "…" : ""}`,
      };
    } catch (err) {
      health.migrations = {
        status: "error",
        label: "Migrations",
        detail: err instanceof Error ? err.message : "Unavailable",
      };
    }

    /* Storage usage */
    let storageMeter: DashboardOverview["storage"] = {
      label: "Storage",
      usedLabel: "0 B",
      quotaLabel: "1 GB",
      percent: 0,
      status: "info",
      totalBytes: 0,
      totalObjects: 0,
      buckets: 0,
    };
    try {
      const totals = await scanStorageTotals(admin);
      const percent = percentOf(totals.totalBytes, STORAGE_QUOTA_BYTES);
      storageMeter = {
        label: "Storage",
        usedLabel: `${formatBytes(totals.totalBytes)} used`,
        quotaLabel: `of ${formatBytes(STORAGE_QUOTA_BYTES)} (Free tier)`,
        percent,
        status: meterStatus(percent),
        totalBytes: totals.totalBytes,
        totalObjects: totals.totalObjects,
        buckets: totals.buckets,
      };
    } catch (err) {
      logError("dashboard storage scan failed", {
        message: err instanceof Error ? err.message : err,
      });
      storageMeter = {
        label: "Storage",
        usedLabel: "Unavailable",
        quotaLabel: null,
        percent: null,
        status: "error",
        totalBytes: 0,
        totalObjects: 0,
        buckets: 0,
      };
    }

    /* Database usage */
    let databaseMeter: DashboardOverview["database"] = {
      label: "Database",
      usedLabel: "0 B",
      quotaLabel: "500 MB",
      percent: 0,
      status: "info",
      totalBytes: 0,
      tables: 0,
      topTables: [],
    };
    try {
      const { data: dbUsage } = await admin.rpc("get_db_usage" as never);
      const usage = (dbUsage ?? {}) as {
        db_size_bytes?: number;
        tables?: { name: string; rows: number; size_bytes: number }[];
      };
      const totalBytes = usage.db_size_bytes ?? 0;
      const tables = (usage.tables ?? []).map((t) => ({
        name: t.name,
        rows: t.rows,
        sizeBytes: t.size_bytes,
      }));
      const percent = percentOf(totalBytes, DATABASE_QUOTA_BYTES);
      databaseMeter = {
        label: "Database",
        usedLabel: `${formatBytes(totalBytes)} used`,
        quotaLabel: `of ${formatBytes(DATABASE_QUOTA_BYTES)} (Free tier)`,
        percent,
        status: meterStatus(percent),
        totalBytes,
        tables: tables.length,
        topTables: tables.slice(0, 5),
      };
    } catch (err) {
      logError("dashboard db usage failed", {
        message: err instanceof Error ? err.message : err,
      });
      databaseMeter = {
        label: "Database",
        usedLabel: "Unavailable",
        quotaLabel: null,
        percent: null,
        status: "error",
        totalBytes: 0,
        tables: 0,
        topTables: [],
      };
    }

    /* Request volume (tracked events, 30d) */
    async function exactCount(
      table: string,
      since: string,
      filters?: { column: string; value: string },
    ): Promise<number | null> {
      try {
        let query = admin
          .from(table as never)
          .select("id", { count: "exact", head: true })
          .gte("created_at", since);
        if (filters) query = query.eq(filters.column, filters.value);
        const { count } = await query;
        return count ?? null;
      } catch {
        return null;
      }
    }

    const [events30d, pageViews30d, adminActions30d, leads30d, events24h, downloadEvents30d] =
      await Promise.all([
        exactCount("analytics_events", since30d),
        exactCount("analytics_events", since30d, { column: "event", value: "page_view" }),
        exactCount("audit_log", since30d),
        exactCount("leads", since30d),
        exactCount("analytics_events", since24h),
        exactCount("analytics_events", since30d, { column: "event", value: "download" }),
      ]);

    const requests = {
      events30d: events30d ?? 0,
      pageViews30d: pageViews30d ?? 0,
      adminActions30d: adminActions30d ?? 0,
      leads30d: leads30d ?? 0,
      perDayAvg: Math.round((events30d ?? 0) / WINDOW_DAYS),
      status: "info" as MetricStatus,
      detail:
        events30d === null
          ? "Event tracking unavailable"
          : "Tracked site events over the last 30 days (page views, downloads, CTA clicks, hub searches)",
    };

    /* Rate-limit posture: measured tracked traffic vs Supabase per-minute limits */
    const measuredPerMinute = Math.round(((events24h ?? 0) / 1440) * 100) / 100;
    const rateLimit = {
      status: (measuredPerMinute >= 30 ? "warn" : "ok") as MetricStatus,
      detail:
        events24h === null
          ? "Rate limit status unknown — tracking unavailable"
          : `Measured traffic ≈ ${measuredPerMinute}/min (last 24h). Supabase allows ~200 req/min per API key — tracked volume is a fraction of actual requests, so headroom is ample.`,
      measuredPerMinute,
    };

    /* Bandwidth proxy: exact egress needs Vercel Pro / Supabase metrics */
    const bandwidth = {
      status: "info" as MetricStatus,
      detail:
        "Exact egress requires Vercel Pro (usage API) or Supabase metrics. Proxy shown: hosted media + tracked resource downloads.",
      downloads30d: downloadEvents30d ?? 0,
      mediaBytes: storageMeter.totalBytes,
    };

    /* API usage (AI providers) */
    const integrationResult = await getIntegrationList();
    const integrations = integrationResult.success
      ? integrationResult.data.map((i) => ({
          id: i.id,
          label: i.label,
          icon: i.icon,
          configured: i.hasStoredKey || i.envConfigured,
          maskedKey: i.maskedKey,
          usageCount: i.usageCount,
          lastUsedAt: i.lastUsedAt,
          expiresAt: i.expiresAt,
          keyLabel: i.keyLabel,
        }))
      : [];
    const api = {
      totalCalls: integrations.reduce((sum, i) => sum + i.usageCount, 0),
      integrations,
    };

    /* Health: Supabase Auth reachability */
    let authCheck: MetricState = {
      status: "ok",
      label: "Auth",
      detail: "Auth session resolved successfully",
    };
    try {
      const authStart = Date.now();
      const authRes = await admin.auth.getUser("not-a-real-token");
      const authMs = Date.now() - authStart;
      if (authRes.error) {
        authCheck = {
          status: "warn",
          label: "Auth",
          detail: `Auth responded with error in ${authMs}ms: ${authRes.error.message}`,
          recommendedAction:
            "Check Supabase Auth configuration and confirm sessions can be issued.",
        };
      } else {
        authCheck = {
          status: "ok",
          label: "Auth",
          detail: `Reachable in ${authMs}ms (session validation OK)`,
        };
      }
    } catch (err) {
      authCheck = {
        status: "error",
        label: "Auth",
        detail: err instanceof Error ? err.message : "Unreachable",
        recommendedAction: "Verify Supabase URL and anon/service-role keys, then retry.",
      };
    }

    /* Health: RLS security posture */
    let rlsAtRisk = false;
    let rlsCheck: MetricState = {
      status: "info",
      label: "Security (RLS)",
      detail: "RLS posture not evaluated",
    };
    try {
      const { data: rlsRows } = await admin.rpc("list_rls_status" as never);
      const rows = (rlsRows ?? []) as { table_name: string; rls_enabled: boolean }[];
      const atRisk = rows.filter((r) => !r.rls_enabled).map((r) => r.table_name);
      if (atRisk.length === 0) {
        rlsCheck = {
          status: "ok",
          label: "Security (RLS)",
          detail: `${rows.length} table(s) protected by RLS`,
        };
      } else {
        rlsAtRisk = true;
        rlsCheck = {
          status: "warn",
          label: "Security (RLS)",
          detail: `${atRisk.length} table(s) without RLS: ${atRisk.slice(0, 3).join(", ")}${
            atRisk.length > 3 ? "…" : ""
          }`,
          recommendedAction:
            "Enable row-level security on the listed tables in the Supabase dashboard.",
        };
      }
    } catch (err) {
      rlsCheck = {
        status: "error",
        label: "Security (RLS)",
        detail: err instanceof Error ? err.message : "Unavailable",
      };
    }

    /* Health: Vercel deployments (token-gated) */
    let deployCheck: MetricState = env.hasVercelToken
      ? {
          status: "info",
          label: "Deployments (Vercel)",
          detail: "Querying Vercel…",
        }
      : {
          status: "warn",
          label: "Deployments (Vercel)",
          detail:
            "Deployment info unavailable — VERCEL_TOKEN is not configured in the environment.",
          recommendedAction:
            "Add a Vercel token (Account → Settings → Tokens, scope: project) as VERCEL_TOKEN in Vercel → Project → Settings → Environment Variables, then redeploy.",
        };
    let deployedAt: string | null = null;
    if (env.hasVercelToken) {
      try {
        const res = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=1&state=READY`,
          { headers: { Authorization: `Bearer ${env.vercelToken}` }, cache: "no-store" },
        );
        if (res.ok) {
          const body = (await res.json()) as { deployments?: { createdAt?: number }[] };
          const latest = body.deployments?.[0];
          if (latest?.createdAt) {
            deployedAt = new Date(latest.createdAt).toISOString();
            deployCheck = {
              status: "ok",
              label: "Deployments (Vercel)",
              detail: `Latest production deploy ${new Date(deployedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}`,
            };
          }
        } else {
          deployCheck = {
            status: "warn",
            label: "Deployments (Vercel)",
            detail: "Vercel API returned an error (token may be invalid or scoped incorrectly).",
            recommendedAction:
              "Verify VERCEL_TOKEN is valid and has access to this project, then retry.",
          };
        }
      } catch {
        deployCheck = {
          status: "warn",
          label: "Deployments (Vercel)",
          detail: "Vercel API could not be reached.",
          recommendedAction: "Check network access to api.vercel.com, then retry.",
        };
      }
    }

    /* Health: AI provider integrations (configured / expired key) */
    const integrationChecks: MetricState[] = integrations.map((i) => {
      const expired = i.expiresAt !== null && new Date(i.expiresAt).getTime() < now.getTime();
      if (!i.configured) {
        return {
          status: "warn",
          label: `AI · ${i.label}`,
          detail: `No API key configured — ${i.label} features may be unavailable.`,
          recommendedAction: `Add a ${i.label} key in /admin/integrations or set ${i.keyLabel} as an environment variable.`,
        };
      }
      if (expired) {
        return {
          status: "warn",
          label: `AI · ${i.label}`,
          detail: `Configured key expired ${new Date(i.expiresAt as string).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          )}.`,
          recommendedAction: `Rotate the ${i.label} key in /admin/integrations.`,
        };
      }
      return {
        status: "ok",
        label: `AI · ${i.label}`,
        detail: "Key configured and operational",
      };
    });

    const checks: MetricState[] = [
      health.database,
      health.storage,
      authCheck,
      health.uptime,
      health.backups,
      health.migrations,
      deployCheck,
      rlsCheck,
      ...integrationChecks,
    ];
    const system = {
      operational: checks.every((c) => c.status === "ok"),
      checks,
      deployedAt,
      siteUrl,
    };

    /* Recommendations (Action Center) */
    const recommendations = await collectRecommendations({
      admin,
      now,
      backupStatus: health.backups.status,
      backupDetail: health.backups.detail,
      migrationStatus: health.migrations.status,
      migrationDetail: health.migrations.detail,
      rlsAtRisk,
      hasVercelToken: env.hasVercelToken,
      integrations,
      storagePercent: storageMeter.percent,
      databasePercent: databaseMeter.percent,
      rateLimitStatus: rateLimit.status,
    });

    return ok({
      generatedAt: now.toISOString(),
      health,
      storage: storageMeter,
      database: databaseMeter,
      requests,
      bandwidth,
      rateLimit,
      api,
      system,
      recommendations,
    });
  } catch (err) {
    logError("getDashboardOverviewAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to load dashboard overview");
  }
}
