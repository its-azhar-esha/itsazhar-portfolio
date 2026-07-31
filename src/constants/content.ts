export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_DEFAULTS = {
  STATUS: "draft" as ContentStatus,
} as const;
