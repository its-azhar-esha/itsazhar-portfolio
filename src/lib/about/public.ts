import { findByKey } from "@/lib/content/repository";
import type { AboutContent } from "@/types/about";
import { DEFAULT_ABOUT_CONTENT } from "./defaults";

export async function getPublicAboutContent(): Promise<AboutContent> {
  try {
    const result = await findByKey("about");
    if (!result.success || !result.data?.content) {
      return DEFAULT_ABOUT_CONTENT;
    }
    return result.data.content as unknown as AboutContent;
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}

export async function getAdminAboutContent(): Promise<AboutContent | null> {
  try {
    const result = await findByKey("about");
    if (!result.success || !result.data?.content) return null;
    return result.data.content as unknown as AboutContent;
  } catch {
    return null;
  }
}
