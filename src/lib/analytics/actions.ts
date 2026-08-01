"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { SETTINGS_ROW_ID, normalizeAnalyticsConfig } from "@/types/settings";
import type { AnalyticsConfig } from "@/types/settings";
import { analyticsConfigSchema } from "@/lib/validation";
import { saveSettings } from "@/lib/settings/repository";

/* ─── Public event tracking (fire-and-forget, must never break pages) ─── */

export interface TrackEventOptions {
  pagePath?: string;
  label?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/* Analytics config is read on every tracked event; cache it briefly so the
   public site never pays a settings row fetch per page view. */
let analyticsConfigCache: { at: number; value: AnalyticsConfig } | null = null;

async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  if (analyticsConfigCache && Date.now() - analyticsConfigCache.at < 60_000) {
    return analyticsConfigCache.value;
  }
  let value: AnalyticsConfig;
  try {
    const admin = createAdminClient();
    const { data } = (await admin
      .from("site_settings")
      .select("analytics_config")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle()) as unknown as { data: { analytics_config: unknown } | null };
    value = normalizeAnalyticsConfig(data?.analytics_config);
  } catch {
    value = normalizeAnalyticsConfig(null);
  }
  analyticsConfigCache = { at: Date.now(), value };
  return value;
}

export async function invalidateAnalyticsConfigCache(): Promise<void> {
  analyticsConfigCache = null;
}

export async function trackEventAction(
  event: string,
  options: TrackEventOptions = {},
): Promise<void> {
  try {
    const config = await getAnalyticsConfig();
    if (!config.enabled) return;
    const supabase = await createClient();
    const metadata: Record<string, unknown> = {
      ...(options.sessionId ? { session: options.sessionId } : {}),
      ...(options.metadata ?? {}),
    };
    await supabase.rpc("track_event", {
      p_event: event,
      p_page_path: options.pagePath ?? "",
      p_label: options.label ?? "",
      p_metadata: metadata,
    } as never);
  } catch {
    // Tracking must never surface to visitors.
  }
}

export async function incrementProjectViewsAction(slug: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_project_views", { p_slug: slug } as never);
  } catch {
    // Non-fatal counter.
  }
}

/* ─── Admin analytics summary ─── */

export interface AnalyticsSummary {
  windowDays: number;
  pageViews30d: number;
  uniqueSessions30d: number;
  downloadsTotal: number;
  downloadEvents30d: number;
  ctaClicks30d: number;
  leads30d: number;
  conversionRate: number | null;
  topProjects: { title: string; slug: string; views: number }[];
  topTemplates: { title: string; slug: string; views: number }[];
  topResources: { title: string; downloads: number }[];
  topSearches: { keyword: string; count: number }[];
  topPages: { path: string; count: number }[];
  ctaBreakdown: { label: string; count: number }[];
  dailyViews: { date: string; count: number }[];
  topBlogPosts: { title: string; slug: string; views: number }[];
  sources: { referrer: string; count: number }[];
  devices: { device: string; count: number }[];
  trackingEnabled: boolean;
  recentEvents: { event: string; page_path: string; label: string; created_at: string }[];
}

interface RawEvent {
  event: string;
  page_path: string;
  label: string;
  metadata: unknown;
  created_at: string;
}

interface EventMetadata {
  session?: string;
  referrer?: string;
  device?: string;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "(direct)";
  } catch {
    return "(direct)";
  }
}

export async function getAnalyticsSummaryAction(): Promise<Result<AnalyticsSummary>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const config = await getAnalyticsConfig();
    const windowDays = Math.max(7, config.windowDays);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, projectsRes, templatesRes, resourcesRes, leadsRes, downloadsRes, postsRes] =
      await Promise.all([
        admin
          .from("analytics_events")
          .select("event,page_path,label,metadata,created_at")
          .gte("created_at", since)
          .limit(1000),
        admin
          .from("projects")
          .select("title,slug,views")
          .order("views", { ascending: false })
          .limit(5),
        admin
          .from("workflow_templates")
          .select("title,slug,views_count")
          .order("views_count", { ascending: false })
          .limit(5),
        admin
          .from("resources")
          .select("title,downloads_count")
          .order("downloads_count", { ascending: false })
          .limit(5),
        admin.from("leads").select("id").gte("created_at", since),
        admin.from("resources").select("downloads_count"),
        admin
          .from("blog_posts")
          .select("title,slug")
          .order("published_at", { ascending: false })
          .limit(100),
      ]);

    const events = (eventsRes.data ?? []) as unknown as RawEvent[];
    const pageViews = events.filter((e) => e.event === "page_view");
    const downloads = events.filter((e) => e.event === "download");
    const ctaClicks = events.filter((e) => e.event === "cta_click");
    const searches = events.filter((e) => e.event === "hub_search");

    const sessionCount = new Set(
      pageViews
        .map((e) => {
          const metadata = (e.metadata ?? {}) as EventMetadata;
          return metadata.session ?? "";
        })
        .filter(Boolean),
    ).size;

    const pathCounts = new Map<string, number>();
    for (const e of pageViews) {
      pathCounts.set(e.page_path, (pathCounts.get(e.page_path) ?? 0) + 1);
    }

    const keywordCounts = new Map<string, number>();
    for (const e of searches) {
      const keyword = e.label.trim() || "(empty)";
      keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
    }

    const ctaCounts = new Map<string, number>();
    for (const e of ctaClicks) {
      const label = e.label.trim() || "(unlabeled)";
      ctaCounts.set(label, (ctaCounts.get(label) ?? 0) + 1);
    }

    // Daily page views across the window, zero-filled so charts are continuous.
    const dailyCounts = new Map<string, number>();
    for (let i = windowDays - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyCounts.set(day, 0);
    }
    for (const e of pageViews) {
      const day = e.created_at.slice(0, 10);
      if (dailyCounts.has(day)) dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
    }

    // Traffic sources + devices from page-view metadata.
    const sourceCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    for (const e of pageViews) {
      const metadata = (e.metadata ?? {}) as EventMetadata;
      const host = metadata.referrer ? hostOf(metadata.referrer) : "(direct)";
      sourceCounts.set(host, (sourceCounts.get(host) ?? 0) + 1);
      const device = metadata.device ?? "unknown";
      deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
    }

    // Top blog posts by page_view count on /blog/<slug>.
    const blogSlugCounts = new Map<string, number>();
    for (const e of pageViews) {
      const match = /^\/blog\/([^/?#]+)/.exec(e.page_path);
      if (match) {
        blogSlugCounts.set(match[1], (blogSlugCounts.get(match[1]) ?? 0) + 1);
      }
    }
    const blogTitleBySlug = new Map(
      (postsRes.data ?? []).map((p: { slug: string; title: string }) => [p.slug, p.title]),
    );
    const topBlogPosts = [...blogSlugCounts.entries()]
      .map(([slug, views]) => ({
        slug,
        title: blogTitleBySlug.get(slug) ?? slug,
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const downloadsTotal = (downloadsRes.data ?? []).reduce(
      (sum: number, r: { downloads_count: number }) => sum + (r.downloads_count ?? 0),
      0,
    );
    const leads30d = leadsRes.count ?? leadsRes.data?.length ?? 0;

    return ok({
      windowDays,
      pageViews30d: pageViews.length,
      uniqueSessions30d: sessionCount,
      downloadsTotal,
      downloadEvents30d: downloads.length,
      ctaClicks30d: ctaClicks.length,
      leads30d,
      conversionRate:
        ctaClicks.length > 0 ? Math.round((leads30d / ctaClicks.length) * 1000) / 10 : null,
      topProjects: (projectsRes.data ?? []) as { title: string; slug: string; views: number }[],
      topTemplates: (templatesRes.data ?? []) as {
        title: string;
        slug: string;
        views: number;
      }[],
      topResources: (resourcesRes.data ?? []).map(
        (r: { title: string; downloads_count: number }) => ({
          title: r.title,
          downloads: r.downloads_count ?? 0,
        }),
      ),
      topSearches: [...keywordCounts.entries()]
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topPages: [...pathCounts.entries()]
        .map(([path, count]) => ({ path: path || "/", count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      ctaBreakdown: [...ctaCounts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dailyViews: [...dailyCounts.entries()].map(([date, count]) => ({ date, count })),
      topBlogPosts,
      sources: [...sourceCounts.entries()]
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      devices: [...deviceCounts.entries()]
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count),
      trackingEnabled: config.enabled,
      recentEvents: [...events]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10)
        .map((e) => ({
          event: e.event,
          page_path: e.page_path,
          label: e.label,
          created_at: e.created_at,
        })),
    });
  } catch (err) {
    logError("getAnalyticsSummaryAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to load analytics");
  }
}

/* ─── Admin config ─── */

export async function saveAnalyticsConfigAction(
  input: Record<string, unknown>,
): Promise<Result<AnalyticsConfig>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = analyticsConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const result = await saveSettings({ analytics_config: parsed.data });
    if (!result.success) return fail(result.error);
    await invalidateAnalyticsConfigCache();
    revalidatePath("/admin/analytics");
    return ok(parsed.data);
  } catch (err) {
    logError("saveAnalyticsConfigAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save analytics settings");
  }
}

/* ─── Admin CSV export ─── */

export async function exportAnalyticsCsvAction(): Promise<Result<string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const config = await getAnalyticsConfig();
    const since = new Date(
      Date.now() - Math.max(7, config.windowDays) * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await admin
      .from("analytics_events")
      .select("created_at,event,page_path,label,session_id")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) return fail(error.message);

    const rows = (data ?? []) as unknown as {
      created_at: string;
      event: string;
      page_path: string;
      label: string;
      session_id: string | null;
    }[];

    const escape = (value: string) => {
      const text = value.replaceAll('"', '""');
      return /[",\n]/.test(text) ? `"${text}"` : text;
    };

    const lines = [
      ["created_at", "event", "page_path", "label", "session_id"],
      ...rows.map((r) => [r.created_at, r.event, r.page_path, r.label, r.session_id ?? ""]),
    ].map((row) => row.map(escape).join(","));

    return ok(lines.join("\n"));
  } catch (err) {
    logError("exportAnalyticsCsvAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to export analytics");
  }
}
