import type { Metadata } from "next";
import { getSeoByPageKey } from "./repository";
import { resolveMediaValue } from "@/lib/media/repository";
import { DEFAULT_SEO, SITE_NAME } from "./defaults";
import { getSiteUrl } from "@/lib/site/urls";
import type { SeoEntry } from "@/types/seo";

function parseRobots(value: string): Metadata["robots"] {
  const [index, follow] = value.split(",");
  return {
    index: index === "index",
    follow: follow === "follow",
  };
}

/** Rejects placeholder/invalid canonical values (e.g. legacy literal "{}")
    so they never leak into <link rel="canonical"> output. */
export function isValidCanonical(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "{}" || trimmed === "[]") return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Extracts the first image URL from Next.js OG image values, which may be
    a plain string, a single OGImage object, or an array of either. */
export function firstOgImageUrl(
  images: NonNullable<Metadata["openGraph"]>["images"],
): string | undefined {
  if (!images) return undefined;
  const first = Array.isArray(images) ? images[0] : images;
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if ("url" in first) return String(first.url);
  return first.toString();
}

/** Rebuilds a canonical URL against the effective site URL so a DB-driven
    domain change (admin panel) propagates to metadata without code edits. */
async function effectiveCanonical(
  fallbackCanonical: string | null | undefined,
  rowCanonical: string | null | undefined,
): Promise<string | null> {
  if (isValidCanonical(rowCanonical)) return rowCanonical;
  if (!fallbackCanonical) return null;
  const siteUrl = await getSiteUrl();
  const relative = fallbackCanonical.startsWith("http")
    ? new URL(fallbackCanonical).pathname
    : fallbackCanonical;
  return `${siteUrl}${relative === "/" ? "" : relative}`;
}

export async function getPageMetadata(pageKey: string): Promise<Metadata> {
  const fallback = DEFAULT_SEO[pageKey];

  let row: SeoEntry | null = null;
  try {
    const result = await getSeoByPageKey(pageKey);
    if (result.success) row = result.data;
  } catch {
    // Fall back to defaults if the lookup fails
  }

  const title = row?.title ?? fallback?.title ?? SITE_NAME;
  const description = row?.description ?? fallback?.description ?? "";
  const keywords = (row?.keywords?.length ? row.keywords : fallback?.keywords) ?? [];
  const ogImage = await resolveMediaValue(row?.og_image ?? fallback?.og_image ?? null);
  const canonical = await effectiveCanonical(fallback?.canonical_url, row?.canonical_url);
  const robots = parseRobots(row?.robots ?? fallback?.robots ?? "index,follow");

  return {
    title,
    description,
    keywords: keywords.length ? keywords.join(", ") : undefined,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
