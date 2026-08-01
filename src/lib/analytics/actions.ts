"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { error as logError } from "@/lib/logger";

/* ─── Public event tracking (fire-and-forget, must never break pages) ─── */

export interface TrackEventOptions {
  pagePath?: string;
  label?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEventAction(
  event: string,
  options: TrackEventOptions = {},
): Promise<void> {
  try {
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
  recentEvents: { event: string; page_path: string; label: string; created_at: string }[];
}

interface RawEvent {
  event: string;
  page_path: string;
  label: string;
  metadata: unknown;
  created_at: string;
}

export async function getAnalyticsSummaryAction(): Promise<Result<AnalyticsSummary>> {
  const WINDOW_DAYS = 30;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const admin = createAdminClient();
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, projectsRes, templatesRes, resourcesRes, leadsRes, downloadsRes] =
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
      ]);

    const events = (eventsRes.data ?? []) as unknown as RawEvent[];
    const pageViews = events.filter((e) => e.event === "page_view");
    const downloads = events.filter((e) => e.event === "download");
    const ctaClicks = events.filter((e) => e.event === "cta_click");
    const searches = events.filter((e) => e.event === "hub_search");

    const sessionCount = new Set(
      pageViews
        .map((e) => {
          const metadata = (e.metadata ?? {}) as { session?: string };
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

    const downloadsTotal = (downloadsRes.data ?? []).reduce(
      (sum: number, r: { downloads_count: number }) => sum + (r.downloads_count ?? 0),
      0,
    );
    const leads30d = leadsRes.count ?? leadsRes.data?.length ?? 0;

    return ok({
      windowDays: WINDOW_DAYS,
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
