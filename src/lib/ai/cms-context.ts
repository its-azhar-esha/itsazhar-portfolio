import { getPublicServicesAction } from "@/lib/services/actions";
import { getPublicProjectsAction } from "@/lib/projects/actions";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicResourcesAction, getPublicTemplatesAction } from "@/lib/hub/actions";
import { createLead } from "@/lib/leads/repository";
import { getEnabledKnowledgeSources, getCustomKnowledge } from "@/lib/ai/config";
import { getPublicHeroContent } from "@/lib/hero/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_ROW_ID } from "@/types/settings";

const CACHE_TTL_MS = 60_000;
const CAPTURE_TTL_MS = 10 * 60_000;

interface CmsCache {
  at: number;
  services: string;
  projects: string;
  blog: string;
  hub: string;
  playground: string;
}

let cache: CmsCache | null = null;

async function loadCmsCache(): Promise<CmsCache> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache;

  const [services, projects, posts, resources, templates] = await Promise.all([
    getPublicServicesAction().catch(() => []),
    getPublicProjectsAction().catch(() => []),
    getPublicBlogPostsAction().catch(() => []),
    getPublicResourcesAction().catch(() => []),
    getPublicTemplatesAction().catch(() => []),
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

  const hubBlock = resources.length
    ? resources
        .slice(0, 10)
        .map((r) => `- ${r.title} (/hub/${r.slug}) — ${r.summary || "no summary"}`)
        .join("\n")
    : "- (no hub resources yet)";

  const playgroundBlock = templates.length
    ? templates
        .slice(0, 8)
        .map(
          (t) =>
            `- ${t.title} (/playground/template/${t.slug}) — ${t.description || "no description"}`,
        )
        .join("\n")
    : "- (no playground templates yet)";

  cache = {
    at: now,
    services: servicesBlock,
    projects: projectsBlock,
    blog: postsBlock,
    hub: hubBlock,
    playground: playgroundBlock,
  };
  return cache;
}

/**
 * Live CMS-backed knowledge for the public AI chat. Falls back to an empty
 * string when Supabase is unavailable (static knowledge still applies).
 * Which sections are included is controlled by the admin AI configuration's
 * knowledge-source toggles.
 */
export async function buildCmsKnowledge(message: string): Promise<string> {
  try {
    const [flags, ctx, customKnowledge] = await Promise.all([
      getEnabledKnowledgeSources(),
      loadCmsCache(),
      getCustomKnowledge(),
    ]);

    const sections: string[] = [];

    if (flags.custom && customKnowledge.trim()) {
      sections.push(`## CUSTOM KNOWLEDGE (ABOUT AZHAR & HIS BUSINESS)\n${customKnowledge.trim()}`);
    }

    if (flags.website) {
      const websiteBlock = await loadWebsiteSection();
      if (websiteBlock) sections.push(websiteBlock);
    }

    if (flags.services) {
      sections.push(`## LIVE SERVICES\n${ctx.services}`);
    }
    if (flags.projects) {
      sections.push(`## LIVE PROJECTS\n${ctx.projects}`);
    }
    if (flags.blog && /blog|article|post|news|insight|read/i.test(message)) {
      sections.push(`## RECENT BLOG POSTS\n${ctx.blog}`);
    }
    if (
      flags.hub &&
      /hub|resource|template|download|tool|prompt|workflow template|playground/i.test(message)
    ) {
      sections.push(`## AUTOMATION HUB RESOURCES\n${ctx.hub}`);
      sections.push(`## PLAYGROUND TEMPLATES\n${ctx.playground}`);
    }

    return sections.join("\n\n");
  } catch {
    return "";
  }
}

interface WebsiteSection {
  title: string;
  tagline: string;
  description: string;
  location: string;
  email: string;
  bookingUrl: string | null;
  socials: string[];
  heroHeadline: string;
  heroHighlight: string;
  heroSubheadline: string;
}

let websiteCache: { at: number; value: WebsiteSection | null } | null = null;

async function loadWebsiteSection(): Promise<string | null> {
  const now = Date.now();
  if (websiteCache && now - websiteCache.at < CACHE_TTL_MS) {
    return websiteCache.value ? formatWebsiteSection(websiteCache.value) : null;
  }

  let value: WebsiteSection | null = null;
  try {
    const [settingsResult, hero] = await Promise.all([
      createAdminClient()
        .from("site_settings")
        .select(
          "site_name, site_title, tagline, site_description, location, contact_email, booking_url, social_github, social_linkedin, social_twitter, social_fiverr, social_instagram, social_youtube",
        )
        .eq("id", SETTINGS_ROW_ID)
        .maybeSingle(),
      getPublicHeroContent(),
    ]);
    const settings = (settingsResult.data ?? null) as {
      site_name?: string | null;
      site_title?: string | null;
      tagline?: string | null;
      site_description?: string | null;
      location?: string | null;
      contact_email?: string | null;
      booking_url?: string | null;
      social_github?: string | null;
      social_linkedin?: string | null;
      social_twitter?: string | null;
      social_fiverr?: string | null;
      social_instagram?: string | null;
      social_youtube?: string | null;
    } | null;
    const socials = [
      settings?.social_github,
      settings?.social_linkedin,
      settings?.social_twitter,
      settings?.social_fiverr,
      settings?.social_instagram,
      settings?.social_youtube,
    ].filter((url): url is string => typeof url === "string" && url.trim() !== "");
    value = {
      title: settings?.site_title || settings?.site_name || "",
      tagline: settings?.tagline || "",
      description: settings?.site_description || "",
      location: settings?.location || "",
      email: settings?.contact_email || "",
      bookingUrl: settings?.booking_url || null,
      socials,
      heroHeadline: hero?.basic?.headline || "",
      heroHighlight: hero?.basic?.highlight || "",
      heroSubheadline: hero?.basic?.subheadline || "",
    };
  } catch {
    value = null;
  }

  websiteCache = { at: now, value };
  return value ? formatWebsiteSection(value) : null;
}

function formatWebsiteSection(value: WebsiteSection): string {
  const lines: string[] = [];
  if (value.title) lines.push(`- Title: ${value.title}`);
  if (value.tagline) lines.push(`- Tagline: ${value.tagline}`);
  if (value.description) lines.push(`- Description: ${value.description}`);
  if (value.location) lines.push(`- Location: ${value.location}`);
  if (value.email) lines.push(`- Email: ${value.email}`);
  if (value.bookingUrl) lines.push(`- Booking link: ${value.bookingUrl}`);
  if (value.heroHeadline) lines.push(`- Hero headline: ${value.heroHeadline}`);
  if (value.heroHighlight) lines.push(`- Hero highlight: ${value.heroHighlight}`);
  if (value.heroSubheadline) lines.push(`- Hero subheadline: ${value.heroSubheadline}`);
  if (value.socials.length > 0) lines.push(`- Social profiles: ${value.socials.join(", ")}`);
  if (lines.length === 0) return "";
  return `## WEBSITE INFO\n${lines.join("\n")}`;
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const NAME_RE = /(?:my name is|i'?m|i am|call me)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i;

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
