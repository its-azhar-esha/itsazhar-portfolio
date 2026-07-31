export const SEO_ROBOTS = [
  "index,follow",
  "index,nofollow",
  "noindex,follow",
  "noindex,nofollow",
] as const;

export type SeoRobots = (typeof SEO_ROBOTS)[number];

export const SEO_DEFAULTS = {
  ROBOTS: "index,follow" as SeoRobots,
} as const;
