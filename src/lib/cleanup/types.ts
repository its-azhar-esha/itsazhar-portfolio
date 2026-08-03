/**
 * Storage & Cleanup — shared types.
 *
 * A "category" is one card on /admin/storage. Each category implements a
 * read-only scan (returns candidate items with real sizes) and a cleanup
 * (deletes/repairs only the items the scan positively identified, re-verified
 * at execution time). Retention options are declared per category and only
 * where they are safe and meaningful.
 */

export type CleanupRetentionMode = "keep-days" | "keep-records" | "keep-latest";

/** One selectable retention rule for a category (e.g. "keep last 90 days"). */
export interface CleanupRetentionOption {
  mode: CleanupRetentionMode;
  label: string;
  /** Sensible default for the rule value (days, records, or "keep N latest"). */
  defaultValue: number;
  min: number;
  max: number;
  /** Only shown when mode === "keep-days". */
  daysLabel?: string;
  /** Only shown when mode === "keep-records". */
  recordsLabel?: string;
}

/** A single candidate found by a scan. */
export interface CleanupItem {
  id: string;
  name: string;
  detail?: string;
  sizeBytes?: number;
}

/** Result of one category scan (real data, no placeholders). */
export interface ScanResult {
  ok: boolean;
  status: "clean" | "issues" | "error";
  total: number;
  sizeBytes: number;
  /** Capped sample of candidates for the confirmation dialog. */
  items: CleanupItem[];
  /** Human-readable summary shown on the card. */
  message: string;
  error?: string;
}

/** User-selected cleanup options (validated by Zod in the action). */
export interface CleanupRequest {
  mode: CleanupRetentionMode;
  value: number;
}

/** Outcome of a cleanup run. */
export interface CleanupResult {
  deleted: number;
  sizeBytes: number;
  /** Per-entity breakdown for the result toast/dialog. */
  breakdown: { label: string; count: number }[];
  message: string;
}

/** Static metadata sent to the client so cards render without scanning. */
export interface CleanupCategoryMeta {
  id: string;
  title: string;
  description: string;
  icon: string;
  group: "media" | "storage" | "logs" | "content" | "references";
  helpId: string;
  /** True when cleanup is destructive and needs extra confirmation. */
  dangerous: boolean;
  retention?: CleanupRetentionOption[];
}

/** Persisted per-category scan state (cleanup_scans table). */
export interface ScanState {
  category: string;
  scannedAt: string;
  status: "clean" | "issues" | "error";
  total: number;
  sizeBytes: number;
  summary: Record<string, unknown>;
}

/** Full definition implemented server-side; meta is what the UI sees. */
export interface CleanupCategory extends CleanupCategoryMeta {
  scan: () => Promise<ScanResult>;
  cleanup: (request: CleanupRequest | null) => Promise<CleanupResult>;
}

export type CleanupOverview = {
  categories: (CleanupCategoryMeta & { scan?: ScanState | null })[];
  scannedAt: string | null;
};
