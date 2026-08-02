/**
 * Freshness helpers for keep-alive status.
 *
 * Keep-alive jobs are DAILY (Vercel cron + GitHub Actions). Status must be
 * derived from how long ago the last successful run happened — NOT from a
 * calendar-day match. A daily job that last succeeded yesterday is healthy;
 * only stale runs (missed days) should surface as warnings/errors.
 */

export type FreshnessStatus = "ok" | "warn" | "error" | "info";

/** A daily job whose last success is within ~30h is healthy (yesterday's run). */
export const DAILY_OK_HOURS = 30;

/** Missed a handful of daily runs → attention. */
const DAILY_WARN_HOURS = 96;

/** A daily job whose last success is older than this is at risk. */
const DAILY_ERROR_HOURS = 7 * 24; // Supabase pauses the project after ~7 days

export interface FreshnessOptions {
  okHours?: number;
  warnHours?: number;
  errorHours?: number;
}

/**
 * Number of whole hours between `iso` and `now` (>= 0).
 * Returns null when `iso` is missing.
 */
export function hoursSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000);
}

/**
 * Derive a status from the age of the last successful run.
 * - null age (no data) → `info`
 * - within okHours → `ok`
 * - within warnHours → `warn`
 * - older than warnHours → `error`
 */
export function statusFromAge(
  ageHours: number | null,
  opts: FreshnessOptions = {},
): FreshnessStatus {
  if (ageHours === null) return "info";
  const okHours = opts.okHours ?? DAILY_OK_HOURS;
  const warnHours = opts.warnHours ?? DAILY_WARN_HOURS;
  const errorHours = opts.errorHours ?? DAILY_ERROR_HOURS;
  if (ageHours <= okHours) return "ok";
  if (ageHours <= warnHours) return "warn";
  if (ageHours <= errorHours) return "error";
  return "error";
}

/** Human label for how long ago something happened. */
export function humanAge(iso: string | null | undefined, now: Date): string {
  const h = hoursSince(iso, now);
  if (h === null) return "never";
  if (h < 1) return `${Math.max(0, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
