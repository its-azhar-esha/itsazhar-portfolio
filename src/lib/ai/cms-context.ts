import { getPublicServicesAction } from "@/lib/services/actions";
import { getPublicProjectsAction } from "@/lib/projects/actions";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { createLead } from "@/lib/leads/repository";

const CACHE_TTL_MS = 60_000;
const CAPTURE_TTL_MS = 10 * 60_000;

interface CmsCache {
  at: number;
  services: string;
  projects: string;
  blog: string;
}

let cache: CmsCache | null = null;

async function loadCmsCache(): Promise<CmsCache> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache;

  const [services, projects, posts] = await Promise.all([
    getPublicServicesAction().catch(() => []),
    getPublicProjectsAction().catch(() => []),
    getPublicBlogPostsAction().catch(() => []),
  ]);

  const servicesBlock = services.length
    ? services.map((s) => `- ${s.title}: ${s.short_description || "no description"}`).join("\n")
    : "- (no published services yet)";

  const projectsBlock = projects.length
    ? projects
        .map((p) => {
          const tech =
            Array.isArray(p.tags) && p.tags.length ? ` | tech: ${p.tags.join(", ")}` : "";
          const industry = p.industry ? `, ${p.industry}` : "";
          return `- ${p.name} (${p.category || "uncategorized"}${industry}) — ${p.description || "no description"}${tech}`;
        })
        .join("\n")
    : "- (no projects yet)";

  const postsBlock = posts.length
    ? posts
        .slice(0, 8)
        .map((p) => `- ${p.title} (${p.slug}) — ${p.excerpt || "no excerpt"}`)
        .join("\n")
    : "- (no published blog posts yet)";

  cache = { at: now, services: servicesBlock, projects: projectsBlock, blog: postsBlock };
  return cache;
}

/**
 * Live CMS-backed knowledge for the public AI chat. Falls back to an empty
 * string when Supabase is unavailable (static knowledge still applies).
 */
export async function buildCmsKnowledge(message: string): Promise<string> {
  try {
    const ctx = await loadCmsCache();
    const sections = [`## LIVE SERVICES\n${ctx.services}`, `## LIVE PROJECTS\n${ctx.projects}`];
    if (/blog|article|post|news|insight|read/i.test(message)) {
      sections.push(`## RECENT BLOG POSTS\n${ctx.blog}`);
    }
    return sections.join("\n\n");
  } catch {
    return "";
  }
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const NAME_RE = /(?:my name is|i'?m|i am|call me)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/;

const capturedLeads = new Map<string, number>();

/**
 * Captures a chat lead when a visitor with booking intent shares an email.
 * Non-fatal: never throws, never blocks the chat response.
 */
export async function captureChatLead(
  messages: { role: string; content: string }[],
  intent: string,
): Promise<void> {
  if (!["contact", "audit", "pricing"].includes(intent)) return;

  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .filter(Boolean);
  const combined = userMessages.join("\n");
  const email = combined.match(EMAIL_RE)?.[0];
  if (!email) return;

  const now = Date.now();
  const lastCapture = capturedLeads.get(email);
  if (lastCapture && now - lastCapture < CAPTURE_TTL_MS) return;
  capturedLeads.set(email, now);

  try {
    const nameMatch = combined.match(NAME_RE);
    const name = nameMatch?.[1] || email.split("@")[0];
    const last = userMessages[userMessages.length - 1] || "";
    await createLead({
      name,
      email,
      source: "chat",
      message: `Interested via AI chat (${intent}): ${last.slice(0, 500)}`,
    });
  } catch {
    // Lead capture is best-effort — never break the chat.
  }
}
