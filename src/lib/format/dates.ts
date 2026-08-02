/**
 * Shared date/time formatting for the admin panel, always displayed in
 * Bangladesh Standard Time (GMT+6, Asia/Dhaka) regardless of the viewer's
 * or server's locale. Display-only — stored values are never modified.
 *
 * Asia/Dhaka is a fixed UTC+6 offset with no DST, so it is stable year-round.
 */

export const ADMIN_TIME_ZONE = "Asia/Dhaka";

export const BD_DATE_TIME_FORMAT = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
} as const;

export const BD_DATE_FORMAT = {
  month: "short",
  day: "numeric",
  year: "numeric",
} as const;

export const BD_DATE_TIME_SHORT_FORMAT = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
} as const;

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Aug 2, 2026, 6:52 PM" in Asia/Dhaka. Empty/parse-fail → "—". */
export function formatDateTimeBD(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIME_ZONE,
    ...BD_DATE_TIME_FORMAT,
  }).format(d);
}

/** "Aug 2, 2026" in Asia/Dhaka. Empty/parse-fail → "—". */
export function formatDateBD(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TIME_ZONE, ...BD_DATE_FORMAT }).format(
    d,
  );
}

/** "Aug 2, 6:52 PM" in Asia/Dhaka (no year). Empty/parse-fail → "—". */
export function formatDateTimeShortBD(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIME_ZONE,
    ...BD_DATE_TIME_SHORT_FORMAT,
  }).format(d);
}

/** "6:52 PM" in Asia/Dhaka. Empty/parse-fail → "—". */
export function formatTimeBD(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** "2026-08-02" (the DB date key) formatted as "Aug 2, 2026" in Dhaka. */
export function formatDateKeyBD(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  // DB date keys are YYYY-MM-DD (UTC). Interpret as noon UTC to avoid
  // timezone edge-cases shifting the displayed date.
  const d = toDate(`${value}T12:00:00Z`);
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TIME_ZONE, ...BD_DATE_FORMAT }).format(
    d,
  );
}
