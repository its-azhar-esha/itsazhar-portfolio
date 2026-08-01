import type { Metadata } from "next";
import {
  Activity,
  ArrowDownRight,
  Download,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummaryAction } from "@/lib/analytics/actions";
import { getSettings } from "@/lib/settings/repository";
import { AnalyticsConfigCard } from "@/components/admin/analytics/config-card";
import { CsvExportButton } from "@/components/admin/analytics/csv-export-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Analytics | Admin" };

function BarList({
  items,
  valueKey,
  labelKey,
  formatValue,
}: {
  items: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey] ?? 0)));
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => {
        const value = Number(item[valueKey] ?? 0);
        return (
          <li key={`${String(item[labelKey])}-${i}`} className="group">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground truncate" title={String(item[labelKey])}>
                {String(item[labelKey])}
              </span>
              <span className="text-foreground shrink-0 font-semibold">
                {formatValue ? formatValue(value) : value}
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{ width: `${Math.max(3, (value / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DailyViewsChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const labelEvery = Math.ceil(data.length / 8);
  return (
    <div>
      <div className="flex h-32 items-end gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} view${d.count === 1 ? "" : "s"}`}
            className="bg-primary/70 hover:bg-primary relative flex-1 rounded-t-sm transition-colors"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-[10px]">
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <span key={d.date}>
              {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : (
            <span key={d.date} />
          ),
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-1 pb-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const [result, settingsResult] = await Promise.all([getAnalyticsSummaryAction(), getSettings()]);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <p className="text-lg font-semibold">Could not load analytics</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const s = result.data;
  const config = settingsResult.success ? settingsResult.data?.analytics_config : undefined;
  const funnelSteps = [
    { label: "Page views", value: s.pageViews30d, icon: Activity },
    { label: "CTA clicks", value: s.ctaClicks30d, icon: MousePointerClick },
    { label: "Leads", value: s.leads30d, icon: Users },
  ];
  const funnelMax = Math.max(1, s.pageViews30d);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Activity from the last {s.windowDays} days. Tracking starts when the page first loads —
            counters build up over time.
          </p>
        </div>
        <CsvExportButton />
      </div>

      {!s.trackingEnabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          Tracking is currently disabled in the analytics configuration below. New events are not
          being recorded.
        </div>
      )}

      {config && <AnalyticsConfigCard initial={config} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Page views"
          value={String(s.pageViews30d)}
          sub={`${s.uniqueSessions30d} unique session${s.uniqueSessions30d === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={Download}
          label="Downloads"
          value={String(s.downloadsTotal + s.downloadEvents30d)}
          sub={`${s.downloadsTotal} lifetime · ${s.downloadEvents30d} in ${s.windowDays}d`}
        />
        <StatCard
          icon={MousePointerClick}
          label="CTA clicks"
          value={String(s.ctaClicks30d)}
          sub="Bookings, Get access & calls-to-action"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={s.conversionRate === null ? "—" : `${s.conversionRate}%`}
          sub={`${s.leads30d} lead${s.leads30d === 1 ? "" : "s"} in ${s.windowDays}d`}
        />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daily page views · last {s.windowDays} days</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyViewsChart data={s.dailyViews} />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4">
                <span className="text-muted-foreground w-24 shrink-0 text-xs font-medium">
                  {step.label}
                </span>
                <div className="bg-muted h-6 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary/70 flex h-full items-center rounded-full px-3 transition-all"
                    style={{ width: `${Math.max(2, (step.value / funnelMax) * 100)}%` }}
                  >
                    <span className="text-primary-foreground text-xs font-semibold">
                      {step.value}
                    </span>
                  </div>
                </div>
                {i < funnelSteps.length - 1 && (
                  <ArrowDownRight className="text-muted-foreground hidden h-4 w-4 shrink-0 lg:block" />
                )}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            {s.conversionRate === null
              ? "Once visitors start clicking CTAs, the page-view → CTA → lead rate appears here."
              : `${s.conversionRate}% of CTA clicks become leads.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Most viewed projects</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topProjects.length ? (
              <BarList items={s.topProjects} valueKey="views" labelKey="title" />
            ) : (
              <EmptyNote text="No views yet — project views are counted on every visit." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Most viewed templates</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topTemplates.length ? (
              <BarList items={s.topTemplates} valueKey="views" labelKey="title" />
            ) : (
              <EmptyNote text="No template views yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Most read blog posts</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topBlogPosts.length ? (
              <BarList items={s.topBlogPosts} valueKey="views" labelKey="title" />
            ) : (
              <EmptyNote text="Blog post views will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Top downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topResources.length ? (
              <BarList items={s.topResources} valueKey="downloads" labelKey="title" />
            ) : (
              <EmptyNote text="No downloadable resources yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Traffic sources</CardTitle>
          </CardHeader>
          <CardContent>
            {s.sources.length ? (
              <BarList items={s.sources} valueKey="count" labelKey="referrer" />
            ) : (
              <EmptyNote text="Referrer data will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {s.devices.length ? (
              <BarList items={s.devices} valueKey="count" labelKey="device" />
            ) : (
              <EmptyNote text="Device data will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Search keywords</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topSearches.length ? (
              <BarList items={s.topSearches} valueKey="count" labelKey="keyword" />
            ) : (
              <EmptyNote text="Hub searches will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Visitor flow · top pages</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topPages.length ? (
              <BarList items={s.topPages} valueKey="count" labelKey="path" />
            ) : (
              <EmptyNote text="Page views will appear here." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">CTA clicks by source</CardTitle>
          </CardHeader>
          <CardContent>
            {s.ctaBreakdown.length ? (
              <BarList items={s.ctaBreakdown} valueKey="count" labelKey="label" />
            ) : (
              <EmptyNote text="CTA clicks will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          {s.recentEvents.length ? (
            <div className="space-y-2">
              {s.recentEvents.map((e) => (
                <div
                  key={`${e.created_at}-${e.event}-${e.label}`}
                  className="border-border/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs"
                >
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                    {e.event}
                  </span>
                  {e.label && <span className="font-medium">{e.label}</span>}
                  {e.page_path && (
                    <span className="text-muted-foreground truncate">{e.page_path}</span>
                  )}
                  <span className="text-muted-foreground ml-auto shrink-0">
                    {new Date(e.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote text="No tracked events yet — visit the site to start collecting data." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm">{text}</p>;
}
