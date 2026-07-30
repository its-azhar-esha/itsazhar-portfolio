import { findByKey } from "@/lib/content/repository";
import type { HeroContent } from "@/types/hero";
import { DEFAULT_HERO_CONTENT } from "./defaults";

export async function getPublicHeroContent(): Promise<HeroContent> {
  try {
    const result = await findByKey("hero");
    if (!result.success || !result.data?.content) {
      return DEFAULT_HERO_CONTENT;
    }
    return result.data.content as unknown as HeroContent;
  } catch {
    return DEFAULT_HERO_CONTENT;
  }
}

export async function getAdminHeroContent(): Promise<HeroContent | null> {
  try {
    const result = await findByKey("hero");
    if (!result.success || !result.data?.content) return null;
    return result.data.content as unknown as HeroContent;
  } catch {
    return null;
  }
}
