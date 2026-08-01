import { findByKey } from "@/lib/content/repository";
import type { HeroContent } from "@/types/hero";
import { resolveMediaValue } from "@/lib/media/repository";
import { DEFAULT_HERO_CONTENT } from "./defaults";

export async function getPublicHeroContent(): Promise<HeroContent> {
  try {
    const result = await findByKey("hero");
    if (!result.success || !result.data?.content) {
      return DEFAULT_HERO_CONTENT;
    }
    const content = result.data.content as unknown as HeroContent;
    if (content.background?.image) {
      const resolved = await resolveMediaValue(content.background.image);
      if (resolved) content.background.image = resolved;
    }
    return content;
  } catch {
    return DEFAULT_HERO_CONTENT;
  }
}

export async function getAdminHeroContent(): Promise<HeroContent> {
  try {
    const result = await findByKey("hero");
    if (!result.success || !result.data?.content) return DEFAULT_HERO_CONTENT;
    return result.data.content as unknown as HeroContent;
  } catch {
    return DEFAULT_HERO_CONTENT;
  }
}
