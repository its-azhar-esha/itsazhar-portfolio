"use server";

/**
 * Keep-Alive report (server-only).
 *
 * Produces a complete overview of every component involved in keeping the
 * project active: the database, storage, tables, buckets, functions (RPCs),
 * scheduled jobs / keep-alive services, the health-check ledger and backups.
 *
 * The project's keep-alive strategy is intentionally EXTERNAL: Vercel cron
 * (/api/health and /api/backup) plus GitHub Actions workflows ping the app
 * daily so Supabase sees API traffic and does not pause the Free-tier project.
 * There are no Supabase pg_cron jobs or edge functions. The report reflects
 * that reality — such components are listed as informational with guidance.
 *
 * Every component is captured defensively; a failing probe degrades to a
 * visible error state instead of failing the whole page.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { ok, fail, type Result } from "@/lib/result";
import type { Database } from "@/database.types";
import { error as logError } from "@/lib/logger";
import { hoursSince, humanAge, statusFromAge, DAILY_OK_HOURS } from "@/lib/keepalive/freshness";

export type KeepAliveStatus = "ok" | "warn" | "error" | "info";

export interface KeepAliveLogEntry {
  at: string;
  ok: boolean;
  detail: string;
  latencyMs: number | null;
}

export interface KeepAliveComponent {
  id: string;
  name: string;
  group:
    | "Infrastructure"
    | "Data tables"
    | "Storage buckets"
    | "Functions"
    | "Scheduled jobs"
    | "Keep-alive services"
    | "Health checks"
    | "Backups";
  kind:
    | "database"
    | "storage"
    | "table"
    | "bucket"
    | "function"
    | "job"
    | "keepalive"
    | "health"
    | "backup";
  status: KeepAliveStatus;
  /** One-line summary for the list row. */
  detail: string;
  /** Last time a keep-alive action succeeded for this component. */
  lastKeepAliveAt: string | null;
  /** Next scheduled keep-alive / run. */
  nextScheduledAt: string | null;
  /** Last health check timestamp. */
  lastHealthCheckAt: string | null;
  /** Last successful response timestamp. */
  lastSuccessAt: string | null;
  /** Last error timestamp. */
  lastErrorAt: string | null;
  /** Last error message. */
  lastError: string | null;
  /** Retry posture (e.g. "automatic daily retry"). */
  retryStatus: string | null;
  /** Failure count within window. */
  failureCount: number;
  /** Success count within window. */
  successCount: number;
  /** Success rate 0-100, null when unknown. */
  successRate: number | null;
  /** Human-readable uptime summary (e.g. "30/30 days healthy"). */
  uptime: string | null;
  /** Last measured response time in ms. */
  responseTimeMs: number | null;
  /** Related recent log entries. */
  relatedLogs: KeepAliveLogEntry[];
  /* Failure / attention explanation (only populated when relevant). */
  whatHappened?: string;
  why?: string;
  impact?: string;
  autoRecovered?: boolean | null;
  recommendedAction?: string;
}

export interface KeepAliveReport {
  generatedAt: string;
  operational: boolean;
  components: KeepAliveComponent[];
  summary: {
    healthy: number;
    warning: number;
    error: number;
    info: number;
    streakDays: number;
    okToday: boolean;
    lastOkAt: string | null;
    recordEnabled: boolean;
  };
}

const HEALTH_WINDOW_DAYS = 60;

type HealthCheckRow = Pick<
  Database["public"]["Tables"]["health_checks"]["Row"],
  "checked_on" | "ok" | "latency_ms" | "detail" | "created_at" | "updated_at"
>;

/* Actual run time of a ledger row: updated_at when present (set on every
   upsert), falling back to created_at for pre-migration rows. */
function rowRunAt(row: Pick<HealthCheckRow, "created_at" | "updated_at"> | null): string | null {
  return row?.updated_at ?? row?.created_at ?? null;
}

/* Representative tables probed for reachability. */
const PROBE_TABLES = [
  "blog_posts",
  "projects",
  "services",
  "media_files",
  "site_settings",
  "health_checks",
  "backups",
] as const;

/* RPC functions verified callable. */
const PROBE_FUNCTIONS = [
  { name: "list_applied_migrations", label: "list_applied_migrations()" },
  { name: "list_rls_status", label: "list_rls_status()" },
] as const;

/* Static scheduling metadata (Vercel cron + GitHub Actions). */
const SCHEDULED_JOBS = [
  {
    id: "vercel-health",
    name: "Vercel cron → /api/health",
    hourUtc: 12,
    description:
      "Primary keep-alive: pings /api/health daily so Supabase sees API traffic and records a health_check row.",
  },
  {
    id: "vercel-backup",
    name: "Vercel cron → /api/backup",
    hourUtc: 0,
    description: "Daily database export to the Supabase 'backups' storage bucket.",
  },
  {
    id: "gh-keepalive",
    name: "GitHub Actions → keepalive",
    hourUtc: 12,
    description:
      "Redundant keep-alive: curls /api/health and fails on non-200 as a fallback if Vercel cron is unavailable.",
  },
  {
    id: "gh-backup",
    name: "GitHub Actions → backup-to-branch",
    hourUtc: 3,
    description: "Secondary offsite backup: exports tables and commits to the 'backups' branch.",
  },
] as const;

/* ─── Helpers ─── */

function nextCronHour(hourUtc: number, now: Date): Date {
  const next = new Date(now);
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function successRate(okCount: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((okCount / total) * 1000) / 10;
}

async function pingTable(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
): Promise<{ latencyMs: number; error: string | null }> {
  const start = Date.now();
  try {
    const { error } = await admin
      .from(table as never)
      .select("id")
      .limit(1);
    return { latencyMs: Date.now() - start, error: error?.message ?? null };
  } catch (err) {
    return {
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unreachable",
    };
  }
}

/* ─── Report ─── */

export async function getKeepAliveReportAction(): Promise<Result<KeepAliveReport>> {
  const now = new Date();
  const report: Partial<KeepAliveReport> = { generatedAt: now.toISOString(), components: [] };
  const components: KeepAliveComponent[] = [];
  let streakDays = 0;
  let okToday = false;
  let recordEnabled = true;
  let lastOkAt: string | null = null;

  try {
    const admin = createAdminClient();

    /* Health-check ledger (window) */
    let checks: HealthCheckRow[] = [];
    try {
      const { data } = await admin
        .from("health_checks")
        .select("checked_on,ok,latency_ms,detail,created_at,updated_at")
        .order("checked_on", { ascending: false })
        .limit(HEALTH_WINDOW_DAYS);
      checks = ((data ?? []) as HealthCheckRow[]).slice().reverse();
    } catch (err) {
      logError("keepalive health_checks read failed", {
        message: err instanceof Error ? err.message : err,
      });
    }

    const okChecks = checks.filter((c) => c.ok);
    const failedChecks = checks.filter((c) => !c.ok);
    const lastOk = okChecks[okChecks.length - 1] ?? null;
    const lastFailed = failedChecks[failedChecks.length - 1] ?? null;
    for (let i = checks.length - 1; i >= 0; i--) {
      if (checks[i].ok) streakDays += 1;
      else break;
    }
    lastOkAt = rowRunAt(lastOk);
    // "Checked today" = last successful check happened within the last day.
    okToday = hoursSince(lastOkAt, now) !== null && (hoursSince(lastOkAt, now) as number) <= 24;
    const lastCheckEntry = checks[checks.length - 1] ?? null;
    const overallHealthRate = successRate(okChecks.length, checks.length);
    const healthComponentStatus: KeepAliveStatus =
      checks.length === 0 ? "info" : statusFromAge(hoursSince(lastOkAt, now));

    /* recordEnabled */
    recordEnabled = true;
    try {
      const { data: settingsRow } = await admin
        .from("site_settings")
        .select("dx_config")
        .maybeSingle();
      const dxConfig = (settingsRow as { dx_config?: { recordHealthChecks?: boolean } } | null)
        ?.dx_config;
      recordEnabled = dxConfig?.recordHealthChecks !== false;
    } catch {
      // Assume enabled if settings unreadable.
    }

    /* ── Infrastructure ── */
    try {
      const start = Date.now();
      const { error } = await admin.from("blog_posts").select("id").limit(1);
      const latencyMs = Date.now() - start;
      const dbEntry = lastCheckEntry;
      components.push({
        id: "database",
        name: "Database",
        group: "Infrastructure",
        kind: "database",
        status: error ? "error" : "ok",
        detail: error
          ? `Probe failed: ${error.message}`
          : `Reachable · responded in ${latencyMs}ms`,
        lastKeepAliveAt: rowRunAt(lastOk),
        nextScheduledAt: null,
        lastHealthCheckAt: rowRunAt(dbEntry),
        lastSuccessAt: rowRunAt(lastOk),
        lastErrorAt: rowRunAt(lastFailed),
        lastError: lastFailed?.detail ?? null,
        retryStatus: lastFailed ? "automatic daily retry" : null,
        failureCount: failedChecks.length,
        successCount: okChecks.length,
        successRate: overallHealthRate,
        uptime: checks.length > 0 ? `${streakDays}/${checks.length} checks healthy` : null,
        responseTimeMs: lastOk?.latency_ms ?? latencyMs,
        relatedLogs: checks.slice(-14).map((c) => ({
          at: c.created_at,
          ok: c.ok,
          detail: c.detail,
          latencyMs: c.latency_ms,
        })),
        ...(error
          ? {
              whatHappened: `A live database probe on blog_posts failed: ${error.message}`,
              why: "The database did not respond to a keep-alive query.",
              impact: "The site cannot read or write data; Supabase may be paused or unreachable.",
              autoRecovered: false,
              recommendedAction:
                "Check the Supabase dashboard for project status and wake the database if paused.",
            }
          : {}),
      });
    } catch (err) {
      components.push({
        id: "database",
        name: "Database",
        group: "Infrastructure",
        kind: "database",
        status: "error",
        detail: err instanceof Error ? err.message : "Unreachable",
        lastKeepAliveAt: rowRunAt(lastOk),
        nextScheduledAt: null,
        lastHealthCheckAt: rowRunAt(lastCheckEntry),
        lastSuccessAt: rowRunAt(lastOk),
        lastErrorAt: rowRunAt(lastFailed),
        lastError: lastFailed?.detail ?? null,
        retryStatus: "automatic daily retry",
        failureCount: failedChecks.length,
        successCount: okChecks.length,
        successRate: overallHealthRate,
        uptime: checks.length > 0 ? `${streakDays}/${checks.length} checks healthy` : null,
        responseTimeMs: lastOk?.latency_ms ?? null,
        relatedLogs: checks
          .slice(-14)
          .map((c) => ({ at: c.created_at, ok: c.ok, detail: c.detail, latencyMs: c.latency_ms })),
        whatHappened: "The database could not be probed.",
        why: "A connection or query against the database failed.",
        impact: "The site cannot serve or store data.",
        autoRecovered: false,
        recommendedAction: "Check Supabase connectivity and the service-role key.",
      });
    }

    /* Storage API */
    try {
      const start = Date.now();
      const { data: buckets, error } = await admin.storage.listBuckets();
      const latencyMs = Date.now() - start;
      components.push({
        id: "storage",
        name: "Storage API",
        group: "Infrastructure",
        kind: "storage",
        status: error ? "error" : "ok",
        detail: error
          ? `Reachability failed: ${error.message}`
          : `${buckets?.length ?? 0} bucket(s) reachable in ${latencyMs}ms`,
        lastKeepAliveAt: rowRunAt(lastOk),
        nextScheduledAt: null,
        lastHealthCheckAt: rowRunAt(lastCheckEntry),
        lastSuccessAt: rowRunAt(lastOk),
        lastErrorAt: rowRunAt(lastFailed),
        lastError: lastFailed?.detail ?? null,
        retryStatus: lastFailed ? "automatic daily retry" : null,
        failureCount: failedChecks.length,
        successCount: okChecks.length,
        successRate: overallHealthRate,
        uptime: checks.length > 0 ? `${streakDays}/${checks.length} checks healthy` : null,
        responseTimeMs: latencyMs,
        relatedLogs: checks
          .slice(-14)
          .map((c) => ({ at: c.created_at, ok: c.ok, detail: c.detail, latencyMs: c.latency_ms })),
        ...(error
          ? {
              whatHappened: "The Storage API could not be reached.",
              why: error.message,
              impact: "Media uploads/downloads and backup storage would fail.",
              autoRecovered: false,
              recommendedAction: "Verify the storage endpoint and bucket permissions in Supabase.",
            }
          : {}),
      });
    } catch (err) {
      components.push({
        id: "storage",
        name: "Storage API",
        group: "Infrastructure",
        kind: "storage",
        status: "error",
        detail: err instanceof Error ? err.message : "Unreachable",
        lastKeepAliveAt: rowRunAt(lastOk),
        nextScheduledAt: null,
        lastHealthCheckAt: rowRunAt(lastCheckEntry),
        lastSuccessAt: rowRunAt(lastOk),
        lastErrorAt: rowRunAt(lastFailed),
        lastError: lastFailed?.detail ?? null,
        retryStatus: "automatic daily retry",
        failureCount: failedChecks.length,
        successCount: okChecks.length,
        successRate: overallHealthRate,
        uptime: checks.length > 0 ? `${streakDays}/${checks.length} checks healthy` : null,
        responseTimeMs: null,
        relatedLogs: checks
          .slice(-14)
          .map((c) => ({ at: c.created_at, ok: c.ok, detail: c.detail, latencyMs: c.latency_ms })),
        whatHappened: "The Storage API could not be reached.",
        why: "A connection error occurred.",
        impact: "Media and backup storage would be unavailable.",
        autoRecovered: false,
        recommendedAction: "Check Supabase storage availability.",
      });
    }

    /* ── Data tables ── */
    for (const table of PROBE_TABLES) {
      try {
        const { latencyMs, error } = await pingTable(admin, table);
        components.push({
          id: `table-${table}`,
          name: table,
          group: "Data tables",
          kind: "table",
          status: error ? "warn" : "ok",
          detail: error ? `Probe failed: ${error}` : `Readable in ${latencyMs}ms`,
          lastKeepAliveAt: null,
          nextScheduledAt: null,
          lastHealthCheckAt: rowRunAt(lastCheckEntry),
          lastSuccessAt: error ? null : now.toISOString(),
          lastErrorAt: error ? now.toISOString() : null,
          lastError: error,
          retryStatus: error ? "retried on next probe" : null,
          failureCount: error ? 1 : 0,
          successCount: error ? 0 : 1,
          successRate: error ? 0 : 100,
          uptime: null,
          responseTimeMs: latencyMs,
          relatedLogs: [],
          ...(error
            ? {
                whatHappened: `A probe on ${table} failed.`,
                why: error,
                impact: `This table being unreachable may indicate schema or permission issues.`,
                autoRecovered: null,
                recommendedAction: "Check table permissions and existence in Supabase.",
              }
            : {}),
        });
      } catch (err) {
        components.push({
          id: `table-${table}`,
          name: table,
          group: "Data tables",
          kind: "table",
          status: "error",
          detail: err instanceof Error ? err.message : "Unreachable",
          lastKeepAliveAt: null,
          nextScheduledAt: null,
          lastHealthCheckAt: null,
          lastSuccessAt: null,
          lastErrorAt: now.toISOString(),
          lastError: err instanceof Error ? err.message : "Unreachable",
          retryStatus: "retried on next probe",
          failureCount: 1,
          successCount: 0,
          successRate: 0,
          uptime: null,
          responseTimeMs: null,
          relatedLogs: [],
          whatHappened: `A probe on ${table} could not be run.`,
          why: err instanceof Error ? err.message : "Unreachable",
          impact: `This table may be misconfigured.`,
          autoRecovered: null,
          recommendedAction: "Check table configuration in Supabase.",
        });
      }
    }

    /* ── Storage buckets ── */
    try {
      const { data: buckets, error } = await admin.storage.listBuckets();
      if (error) throw new Error(error.message);
      for (const bucket of buckets ?? []) {
        components.push({
          id: `bucket-${bucket.id}`,
          name: bucket.name,
          group: "Storage buckets",
          kind: "bucket",
          status: "ok",
          detail: `${bucket.public ? "Public" : "Private"} bucket · id ${bucket.id}`,
          lastKeepAliveAt: null,
          nextScheduledAt: null,
          lastHealthCheckAt: rowRunAt(lastCheckEntry),
          lastSuccessAt: now.toISOString(),
          lastErrorAt: null,
          lastError: null,
          retryStatus: null,
          failureCount: 0,
          successCount: 1,
          successRate: 100,
          uptime: null,
          responseTimeMs: null,
          relatedLogs: [],
        });
      }
    } catch (err) {
      components.push({
        id: "buckets",
        name: "Storage buckets",
        group: "Storage buckets",
        kind: "bucket",
        status: "error",
        detail: err instanceof Error ? err.message : "Unreachable",
        lastKeepAliveAt: null,
        nextScheduledAt: null,
        lastHealthCheckAt: rowRunAt(lastCheckEntry),
        lastSuccessAt: null,
        lastErrorAt: now.toISOString(),
        lastError: err instanceof Error ? err.message : "Unreachable",
        retryStatus: "automatic retry",
        failureCount: 1,
        successCount: 0,
        successRate: 0,
        uptime: null,
        responseTimeMs: null,
        relatedLogs: [],
        whatHappened: "Could not list storage buckets.",
        why: err instanceof Error ? err.message : "Unreachable",
        impact: "Bucket-level operations (uploads/backups) would fail.",
        autoRecovered: false,
        recommendedAction: "Verify Storage API access.",
      });
    }

    /* ── Functions (RPCs) ── */
    for (const fn of PROBE_FUNCTIONS) {
      try {
        const start = Date.now();
        const { error } = await admin.rpc(fn.name as never);
        const latencyMs = Date.now() - start;
        components.push({
          id: `fn-${fn.name}`,
          name: fn.label,
          group: "Functions",
          kind: "function",
          status: error ? "warn" : "ok",
          detail: error ? `Call failed: ${error.message}` : `RPC callable in ${latencyMs}ms`,
          lastKeepAliveAt: null,
          nextScheduledAt: null,
          lastHealthCheckAt: rowRunAt(lastCheckEntry),
          lastSuccessAt: error ? null : now.toISOString(),
          lastErrorAt: error ? now.toISOString() : null,
          lastError: error?.message ?? null,
          retryStatus: error ? "retried on next probe" : null,
          failureCount: error ? 1 : 0,
          successCount: error ? 0 : 1,
          successRate: error ? 0 : 100,
          uptime: null,
          responseTimeMs: latencyMs,
          relatedLogs: [],
          ...(error
            ? {
                whatHappened: `The ${fn.name}() RPC could not be executed.`,
                why: error.message,
                impact:
                  "Features relying on this function (e.g. migrations, RLS reporting) would fail.",
                autoRecovered: null,
                recommendedAction: "Check the function definition and grants in Supabase.",
              }
            : {}),
        });
      } catch (err) {
        components.push({
          id: `fn-${fn.name}`,
          name: fn.label,
          group: "Functions",
          kind: "function",
          status: "error",
          detail: err instanceof Error ? err.message : "Unreachable",
          lastKeepAliveAt: null,
          nextScheduledAt: null,
          lastHealthCheckAt: null,
          lastSuccessAt: null,
          lastErrorAt: now.toISOString(),
          lastError: err instanceof Error ? err.message : "Unreachable",
          retryStatus: "retried on next probe",
          failureCount: 1,
          successCount: 0,
          successRate: 0,
          uptime: null,
          responseTimeMs: null,
          relatedLogs: [],
          whatHappened: `The ${fn.name}() RPC could not be executed.`,
          why: err instanceof Error ? err.message : "Unreachable",
          impact: "Features relying on this function would fail.",
          autoRecovered: null,
          recommendedAction: "Check the function definition in Supabase.",
        });
      }
    }

    /* ── Scheduled jobs + keep-alive services ── */
    const jobStatusFor = (
      id: string,
    ): { status: KeepAliveStatus; detail: string; action: string } => {
      switch (id) {
        case "vercel-health":
        case "gh-keepalive": {
          if (checks.length === 0)
            return {
              status: "info",
              detail: "No health checks recorded yet",
              action: "Verify the cron has run at least once.",
            };
          const age = hoursSince(lastOkAt, now);
          const status = statusFromAge(age);
          if (status === "ok")
            return {
              status: "ok",
              detail: `Last check ${humanAge(lastOkAt, now)} (${streakDays}d streak)`,
              action: "",
            };
          if (status === "warn")
            return {
              status: "warn",
              detail: `No successful check in the last ${Math.round(age as number)}h`,
              action: "Ensure Vercel cron / GitHub keep-alive is enabled and hitting /api/health.",
            };
          return {
            status: "error",
            detail: `Last successful check ${humanAge(lastOkAt, now)}`,
            action: "Wake the project manually — it may be close to Supabase's idle pause.",
          };
        }
        case "vercel-backup":
        case "gh-backup":
          return {
            status: "info",
            detail: "Scheduled daily; see Backups section for latest run",
            action: "",
          };
        default:
          return { status: "info", detail: "", action: "" };
      }
    };

    for (const job of SCHEDULED_JOBS) {
      const { status, detail, action } = jobStatusFor(job.id);
      const lastForJob =
        job.id === "vercel-health" || job.id === "gh-keepalive" ? rowRunAt(lastOk) : null;
      components.push({
        id: job.id,
        name: job.name,
        group: job.id.startsWith("vercel") ? "Scheduled jobs" : "Keep-alive services",
        kind: job.id.startsWith("vercel") ? "job" : "keepalive",
        status,
        detail: detail || `${job.description} Runs daily at ${job.hourUtc}:00 UTC.`,
        lastKeepAliveAt: lastForJob,
        nextScheduledAt: nextCronHour(job.hourUtc, now).toISOString(),
        lastHealthCheckAt: rowRunAt(lastCheckEntry),
        lastSuccessAt: lastForJob,
        lastErrorAt: rowRunAt(lastFailed),
        lastError: lastFailed?.detail ?? null,
        retryStatus: "automatic daily schedule",
        failureCount: failedChecks.length,
        successCount: okChecks.length,
        successRate: overallHealthRate,
        uptime: checks.length > 0 ? `${streakDays}/${checks.length} checks healthy` : null,
        responseTimeMs: lastOk?.latency_ms ?? null,
        relatedLogs: checks
          .slice(-14)
          .map((c) => ({ at: c.created_at, ok: c.ok, detail: c.detail, latencyMs: c.latency_ms })),
        ...(status !== "ok" && status !== "info"
          ? {
              whatHappened:
                status === "error"
                  ? `The last successful keep-alive was ${humanAge(lastOkAt, now)} ago.`
                  : `No successful keep-alive was recorded in the last ${Math.round(
                      hoursSince(lastOkAt, now) as number,
                    )}h.`,
              why:
                status === "error"
                  ? "A daily keep-alive appears to have been missed for several days."
                  : "The scheduled keep-alive may not have run, or it ran but failed.",
              impact:
                "Without daily traffic, the Supabase Free-tier project could pause after ~7 days.",
              autoRecovered: null,
              recommendedAction:
                action || "Verify Vercel cron and the GitHub keep-alive workflow are active.",
            }
          : {}),
      });
    }

    /* ── Health checks (aggregate) ── */
    components.push({
      id: "health-checks",
      name: "Health checks ledger",
      group: "Health checks",
      kind: "health",
      status: healthComponentStatus,
      detail:
        checks.length === 0
          ? "No health checks recorded yet"
          : `${okChecks.length}/${checks.length} OK · ${streakDays}-day streak`,
      lastKeepAliveAt: rowRunAt(lastOk),
      nextScheduledAt: nextCronHour(12, now).toISOString(),
      lastHealthCheckAt: rowRunAt(lastCheckEntry),
      lastSuccessAt: rowRunAt(lastOk),
      lastErrorAt: rowRunAt(lastFailed),
      lastError: lastFailed?.detail ?? null,
      retryStatus: lastFailed ? "automatic daily retry" : null,
      failureCount: failedChecks.length,
      successCount: okChecks.length,
      successRate: overallHealthRate,
      uptime: checks.length > 0 ? `${streakDays} consecutive day(s) healthy` : null,
      responseTimeMs: lastOk?.latency_ms ?? null,
      relatedLogs: checks
        .slice(-21)
        .map((c) => ({ at: c.created_at, ok: c.ok, detail: c.detail, latencyMs: c.latency_ms })),
      ...(!recordEnabled
        ? {
            whatHappened: "Health-check recording is disabled in site settings.",
            why: "The 'Record keep-alive checks' toggle is off in dx_config.",
            impact: "No ledger rows are written, so uptime/streak cannot be tracked.",
            recommendedAction: "Re-enable 'Record keep-alive checks' in Developer Tools settings.",
          }
        : healthComponentStatus !== "ok"
          ? {
              whatHappened:
                checks.length === 0
                  ? "No health checks have been recorded."
                  : `The last successful health check was ${humanAge(lastOkAt, now)} ago.`,
              why:
                checks.length === 0
                  ? "The daily keep-alive has not run yet."
                  : healthComponentStatus === "error"
                    ? "A daily keep-alive appears to have been missed for several days."
                    : (lastFailed?.detail ??
                      "The most recent check did not complete successfully."),
              impact:
                healthComponentStatus === "error"
                  ? "The project may be close to Supabase's ~7-day idle pause."
                  : "Unable to confirm the project is being kept active.",
              autoRecovered: null,
              recommendedAction:
                "Confirm Vercel cron and the GitHub keep-alive workflow are running.",
            }
          : {}),
    });

    /* ── Backups (aggregate) ── */
    try {
      const { data } = await admin
        .from("backups")
        .select("backup_date,status,table_count,file_count,size_bytes,created_at,updated_at")
        .order("backup_date", { ascending: false })
        .limit(1);
      const latest = (data ?? [])[0] as
        | {
            backup_date: string;
            status: string;
            created_at: string;
            updated_at: string | null;
            table_count: number;
          }
        | undefined;
      const lastRunAt = latest?.updated_at ?? latest?.created_at ?? null;
      const ageHours = hoursSince(lastRunAt, now);
      const backupStatus: KeepAliveStatus = latest
        ? latest.status !== "ok"
          ? "error"
          : statusFromAge(ageHours)
        : "info";
      const backupHealthy = backupStatus === "ok";
      components.push({
        id: "backups",
        name: "Backups",
        group: "Backups",
        kind: "backup",
        status: backupStatus,
        detail: latest
          ? `Last backup ${latest.backup_date} · ${latest.status}${ageHours !== null ? ` · ${humanAge(lastRunAt, now)}` : ""}`
          : "No backup recorded yet",
        lastKeepAliveAt: lastRunAt,
        nextScheduledAt: nextCronHour(0, now).toISOString(),
        lastHealthCheckAt: lastRunAt,
        lastSuccessAt: latest?.status === "ok" ? lastRunAt : null,
        lastErrorAt: latest && latest.status !== "ok" ? lastRunAt : null,
        lastError: latest && latest.status !== "ok" ? `Backup status: ${latest.status}` : null,
        retryStatus: "automatic daily schedule",
        failureCount: latest && latest.status !== "ok" ? 1 : 0,
        successCount: latest && latest.status === "ok" ? 1 : 0,
        successRate: latest ? (latest.status === "ok" ? 100 : 0) : null,
        uptime: latest ? `Last ${latest.table_count} table(s) exported` : null,
        responseTimeMs: null,
        relatedLogs: [],
        ...(latest && latest.status !== "ok"
          ? {
              whatHappened: `The latest backup (${latest.backup_date}) reported status "${latest.status}".`,
              why: "The backup export did not complete successfully.",
              impact: "Point-in-time recovery data may be missing.",
              autoRecovered: null,
              recommendedAction: "Review the backup workflow logs and re-run the backup.",
            }
          : latest && !backupHealthy && ageHours !== null && ageHours > DAILY_OK_HOURS
            ? {
                whatHappened: `The last successful backup was ${humanAge(lastRunAt, now)} ago.`,
                why: "The daily backup has not produced a new ledger row recently.",
                impact: "Backup recovery is stale.",
                autoRecovered: null,
                recommendedAction:
                  "Verify the Vercel /api/backup cron and GitHub backup workflow are running.",
              }
            : {}),
      });
    } catch (err) {
      components.push({
        id: "backups",
        name: "Backups",
        group: "Backups",
        kind: "backup",
        status: "error",
        detail: err instanceof Error ? err.message : "Unavailable",
        lastKeepAliveAt: null,
        nextScheduledAt: nextCronHour(0, now).toISOString(),
        lastHealthCheckAt: null,
        lastSuccessAt: null,
        lastErrorAt: now.toISOString(),
        lastError: err instanceof Error ? err.message : "Unavailable",
        retryStatus: "automatic daily schedule",
        failureCount: 1,
        successCount: 0,
        successRate: 0,
        uptime: null,
        responseTimeMs: null,
        relatedLogs: [],
        whatHappened: "The backups ledger could not be read.",
        why: err instanceof Error ? err.message : "Unavailable",
        impact: "Backup status visibility is unavailable.",
        autoRecovered: false,
        recommendedAction: "Check the backups table and service-role access.",
      });
    }

    report.components = components;
  } catch (err) {
    logError("getKeepAliveReportAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to load keep-alive report");
  }

  const summary = {
    healthy: components.filter((c) => c.status === "ok").length,
    warning: components.filter((c) => c.status === "warn").length,
    error: components.filter((c) => c.status === "error").length,
    info: components.filter((c) => c.status === "info").length,
    streakDays,
    okToday,
    lastOkAt,
    recordEnabled,
  } satisfies KeepAliveReport["summary"];

  return ok({
    generatedAt: report.generatedAt as string,
    operational: summary.error === 0 && summary.warning === 0,
    components,
    summary,
  });
}
