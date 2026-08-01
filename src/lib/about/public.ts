import { findByKey } from "@/lib/content/repository";
import type { AboutContent } from "@/types/about";
import { resolveMediaValue } from "@/lib/media/repository";
import { DEFAULT_ABOUT_CONTENT } from "./defaults";

export async function getPublicAboutContent(): Promise<AboutContent> {
  try {
    const result = await findByKey("about");
    if (!result.success || !result.data?.content) {
      return DEFAULT_ABOUT_CONTENT;
    }
    const content = result.data.content as unknown as AboutContent;
    if (content.basic?.profileImage) {
      const resolved = await resolveMediaValue(content.basic.profileImage);
      if (resolved) content.basic.profileImage = resolved;
    }
    return content;
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}

export async function getAdminAboutContent(): Promise<AboutContent> {
  try {
    const result = await findByKey("about");
    if (!result.success || !result.data?.content) return DEFAULT_ABOUT_CONTENT;
    return result.data.content as unknown as AboutContent;
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}
