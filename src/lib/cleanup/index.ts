// Server module. Client components must import from "./actions" directly —
// never from this barrel (the registry imports the supabase admin client).
export { CLEANUP_CATEGORIES, getCleanupCategory } from "./registry";
export type {
  CleanupCategory,
  CleanupCategoryMeta,
  CleanupItem,
  CleanupRequest,
  CleanupResult,
  CleanupRetentionMode,
  CleanupRetentionOption,
  CleanupOverview,
  ScanResult,
  ScanState,
} from "./types";
