import { findByKey } from "./repository";
import { deepMerge } from "./merge";

/**
 * Resolves page content for public rendering: stored entry deep-merged over
 * defaults, so partial entries (or missing DB) still render every field.
 */
export async function getPublicPageContent<T extends object>(key: string, defaults: T): Promise<T> {
  try {
    const result = await findByKey(key);
    if (!result.success || !result.data?.content) return defaults;
    return deepMerge(
      defaults as Record<string, unknown>,
      result.data.content as Record<string, unknown>,
    ) as T;
  } catch {
    return defaults;
  }
}

/** Raw stored content for admin editors, or null when the entry doesn't exist yet. */
export async function getAdminPageContent(
  key: string,
): Promise<{ id: string; content: Record<string, unknown> } | null> {
  try {
    const result = await findByKey(key);
    if (!result.success || !result.data) return null;
    return {
      id: result.data.id,
      content: (result.data.content as Record<string, unknown>) ?? {},
    };
  } catch {
    return null;
  }
}
