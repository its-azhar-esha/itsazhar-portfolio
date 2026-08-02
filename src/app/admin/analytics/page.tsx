import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Download,
  Globe,
  ListOrdered,
  Map,
  Monitor,
  MousePointerClick,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummaryAction } from "@/lib/analytics/actions";
import { getSettings } from "@/lib/settings/repository";
import { AnalyticsConfigCard } from "@/components/admin/analytics/config-card";
import { CsvExportButton } from "@/components/admin/analytics/csv-export-button";
import { SectionCard } from "@/components/admin/section-card";
import { HelpButton } from "@/components/ui/help-dialog";
import { formatDateKeyBD, formatDateTimeShortBD } from "@/lib/format/dates";

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
            <span key={d.date}>{formatDateKeyBD(d.date)}</span>
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
  help,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  help: string;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
          <HelpButton helpId={help} label={`Help about ${label}`} className="ml-auto" />
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Activity from the last {s.windowDays} days. Tracking starts when the page first loads —
            counters build up over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton helpId="analytics-page" label="Help about the Analytics page" align="left" />
          <CsvExportButton />
        </div>
      </div>

      {!s.trackingEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
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
          help="analytics-page"
        />
        <StatCard
          icon={Download}
          label="Downloads"
          value={String(s.downloadsTotal + s.downloadEvents30d)}
          sub={`${s.downloadsTotal} lifetime · ${s.downloadEvents30d} in ${s.windowDays}d`}
          help="analytics-top-resources"
        />
        <StatCard
          icon={MousePointerClick}
          label="CTA clicks"
          value={String(s.ctaClicks30d)}
          sub="Bookings, Get access & calls-to-action"
          help="analytics-cta-breakdown"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={s.conversionRate === null ? "—" : `${s.conversionRate}%`}
          sub={`${s.leads30d} lead${s.leads30d === 1 ? "" : "s"} in ${s.windowDays}d`}
          help="analytics-funnel"
        />
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <Activity className="h-3.5 w-3.5" />
            </span>
            Daily page views · last {s.windowDays} days
            <HelpButton helpId="analytics-chart" label="Help about the daily views chart" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3 pb-4">
          <DailyViewsChart data={s.dailyViews} />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            Conversion funnel
            <HelpButton helpId="analytics-funnel" label="Help about the conversion funnel" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3 pb-4">
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
        <SectionCard title="Most viewed projects" icon={Activity} help="analytics-top-projects">
          {s.topProjects.length ? (
            <BarList items={s.topProjects} valueKey="views" labelKey="title" />
          ) : (
            <EmptyNote text="No views yet — project views are counted on every visit." />
          )}
        </SectionCard>

        <SectionCard title="Most viewed templates" icon={Activity} help="analytics-top-templates">
          {s.topTemplates.length ? (
            <BarList items={s.topTemplates} valueKey="views" labelKey="title" />
          ) : (
            <EmptyNote text="No template views yet." />
          )}
        </SectionCard>

        <SectionCard title="Most read blog posts" icon={Activity} help="analytics-top-blog">
          {s.topBlogPosts.length ? (
            <BarList items={s.topBlogPosts} valueKey="views" labelKey="title" />
          ) : (
            <EmptyNote text="Blog post views will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Top downloads" icon={Download} help="analytics-top-resources">
          {s.topResources.length ? (
            <BarList items={s.topResources} valueKey="downloads" labelKey="title" />
          ) : (
            <EmptyNote text="No downloadable resources yet." />
          )}
        </SectionCard>

        <SectionCard title="Traffic sources" icon={Globe} help="analytics-sources">
          {s.sources.length ? (
            <BarList items={s.sources} valueKey="count" labelKey="referrer" />
          ) : (
            <EmptyNote text="Referrer data will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Devices" icon={Monitor} help="analytics-devices">
          {s.devices.length ? (
            <BarList items={s.devices} valueKey="count" labelKey="device" />
          ) : (
            <EmptyNote text="Device data will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Search keywords" icon={Search} help="analytics-keywords-top">
          {s.topSearches.length ? (
            <BarList items={s.topSearches} valueKey="count" labelKey="keyword" />
          ) : (
            <EmptyNote text="Hub searches will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Visitor flow · top pages" icon={Map} help="analytics-pages">
          {s.topPages.length ? (
            <BarList items={s.topPages} valueKey="count" labelKey="path" />
          ) : (
            <EmptyNote text="Page views will appear here." />
          )}
        </SectionCard>

        <SectionCard
          title="CTA clicks by source"
          icon={MousePointerClick}
          help="analytics-cta-breakdown"
        >
          {s.ctaBreakdown.length ? (
            <BarList items={s.ctaBreakdown} valueKey="count" labelKey="label" />
          ) : (
            <EmptyNote text="CTA clicks will appear here." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent events" icon={ListOrdered} help="analytics-recent">
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
                  {formatDateTimeShortBD(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote text="No tracked events yet — visit the site to start collecting data." />
        )}
      </SectionCard>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm">{text}</p>;
}
