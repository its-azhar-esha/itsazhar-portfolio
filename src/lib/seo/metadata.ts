import type { Metadata } from "next";
import { getSeoByPageKey } from "./repository";
import { resolveMediaValue } from "@/lib/media/repository";
import { DEFAULT_SEO, SITE_NAME } from "./defaults";
import type { SeoEntry } from "@/types/seo";

function parseRobots(value: string): Metadata["robots"] {
  const [index, follow] = value.split(",");
  return {
    index: index === "index",
    follow: follow === "follow",
  };
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
  const canonical = row?.canonical_url ?? fallback?.canonical_url ?? null;
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
  };
}
