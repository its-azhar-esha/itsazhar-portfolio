import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Info,
  Lightbulb,
  Rocket,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getDashboardOverviewAction,
  type DashboardOverview,
  type MetricState,
  type MetricStatus,
  type Recommendation,
  type RecommendationSeverity,
  type UsageMeter,
} from "@/lib/dashboard/actions";
import { formatBytes, formatCount } from "@/lib/dashboard/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard | Admin" };

const STATUS_META: Record<
  MetricStatus,
  { label: string; dot: string; badge: string; emoji: string }
> = {
  ok: {
    label: "Healthy",
    dot: "bg-emerald-500",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    emoji: "🟢",
  },
  warn: {
    label: "Needs attention",
    dot: "bg-amber-500",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    emoji: "🟡",
  },
  error: {
    label: "Unavailable",
    dot: "bg-red-500",
    badge: "border-red-500/30 bg-red-500/10 text-red-500",
    emoji: "🔴",
  },
  info: {
    label: "Info",
    dot: "bg-sky-500",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    emoji: "ℹ️",
  },
};

function StatusBadge({ status }: { status: MetricStatus }) {
  const meta = getStatusMeta(status);
  return (
    <Badge className={`${meta.badge} text-[10px]`}>
      <span className="mr-1">{meta.emoji}</span>
      {meta.label}
    </Badge>
  );
}

function MeterCard({
  icon: Icon,
  meter,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  meter: UsageMeter;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {meter.label}
        </CardTitle>
        <StatusBadge status={meter.status} />
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <p className="text-xl font-bold tracking-tight">{meter.usedLabel}</p>
        <p className="text-muted-foreground mt-0.5 h-4 text-xs">
          {meter.quotaLabel ?? "Quota unknown"}
        </p>
        <div className="mt-3">
          {meter.percent !== null ? (
            <div className="space-y-1.5">
              <div className="bg-accent h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${
                    meter.status === "error"
                      ? "bg-red-500"
                      : meter.status === "warn"
                        ? "bg-amber-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${meter.percent}%` }}
                />
              </div>
              <p className="text-muted-foreground text-[11px]">
                {meter.percent}% of quota used — resource utilization
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-[11px]">Utilization unavailable</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function HealthChips({ checks }: { checks: MetricState[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {checks.map((check) => {
        const meta = getStatusMeta(check.status);
        return (
          <span
            key={check.label}
            title={`${check.detail}${check.recommendedAction ? ` — ${check.recommendedAction}` : ""}`}
            className="border-border/40 bg-accent/40 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
          >
            <span>{meta.emoji}</span>
            {check.label}
          </span>
        );
      })}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/40 bg-accent/40 rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

const SEVERITY_META: Record<RecommendationSeverity, { label: string; dot: string; badge: string }> =
  {
    high: {
      label: "High",
      dot: "bg-red-500",
      badge: "border-red-500/30 bg-red-500/10 text-red-500",
    },
    medium: {
      label: "Medium",
      dot: "bg-amber-500",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    },
    low: {
      label: "Low",
      dot: "bg-sky-500",
      badge: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    },
    info: {
      label: "Info",
      dot: "bg-slate-400",
      badge: "border-slate-400/30 bg-slate-400/10 text-slate-500",
    },
  };

const SEVERITY_ORDER: RecommendationSeverity[] = ["high", "medium", "low", "info"];

function getStatusMeta(status: MetricStatus) {
  return STATUS_META[status] ?? STATUS_META.info;
}

function getSeverityMeta(severity: RecommendationSeverity) {
  return SEVERITY_META[severity] ?? SEVERITY_META.info;
}

function RecommendationsCard({ recommendations }: { recommendations: Recommendation[] }) {
  const sorted = [...recommendations].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  const bySeverity = (s: RecommendationSeverity) =>
    recommendations.filter((r) => r.severity === s).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 p-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Lightbulb className="h-3.5 w-3.5" />
          </span>
          Recommendations
          <span className="text-muted-foreground text-xs font-normal">· Action Center</span>
        </CardTitle>
        {recommendations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {SEVERITY_ORDER.filter((s) => bySeverity(s) > 0).map((s) => {
              const sm = getSeverityMeta(s);
              return (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sm.badge}`}
                >
                  <span className={`${sm.dot} h-1.5 w-1.5 rounded-full`} />
                  {bySeverity(s)} {sm.label.toLowerCase()}
                </span>
              );
            })}
          </div>
        ) : (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600">
            All clear
          </Badge>
        )}
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        {sorted.length === 0 ? (
          <div className="border-border/40 bg-accent/30 rounded-lg border px-4 py-6 text-center">
            <p className="text-sm font-medium">No recommendations right now</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Everything looks healthy. We&apos;ll surface actionable items here when there&apos;s
              something worth reviewing.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((rec) => {
              const meta = getSeverityMeta(rec.severity);
              return (
                <Link
                  key={rec.id}
                  href={rec.href}
                  className="border-border/40 bg-accent/30 hover:bg-accent/60 group flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                >
                  <span
                    className={`${meta.dot} mt-1.5 h-2 w-2 shrink-0 rounded-full`}
                    title={meta.label}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${meta.badge}`}
                      >
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      <span className="text-foreground font-medium">Why:</span> {rec.why}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      <span className="text-foreground font-medium">Impact:</span> {rec.impact}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed">
                      <span className="text-primary font-medium">Action:</span> {rec.action}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground group-hover:text-foreground mt-1 h-4 w-4 shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const result = await getDashboardOverviewAction();

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Could not load dashboard</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const d: DashboardOverview = result.data;
  const systemOperational = d.system.operational;
  const generated = new Date(d.generatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Platform health, usage and capacity at a glance.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">Generated {generated}</p>
      </div>

      {/* System status */}
      <Card
        className={`border-border/50 ${
          systemOperational
            ? "to-background bg-gradient-to-br from-emerald-500/10"
            : "to-background bg-gradient-to-br from-amber-500/10"
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {systemOperational ? (
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              {systemOperational ? "All systems operational" : "Attention needed"}
            </CardTitle>
            <HealthChips checks={d.system.checks} />
          </div>
          <p className="text-muted-foreground text-xs">
            {d.system.checks.map((c) => c.label).join(" · ")} — hover a chip for details.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Rocket className="h-3 w-3" />
              {d.system.deployedAt
                ? `Deployed ${new Date(d.system.deployedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "Deploy info not available (set VERCEL_TOKEN to enable)"}
            </span>
            <Link
              href="/admin/dx"
              className="text-primary hover:text-primary/80 flex items-center gap-1.5"
            >
              <Gauge className="h-3 w-3" />
              Open developer report →
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations / Action Center */}
      <RecommendationsCard recommendations={d.recommendations} />

      {/* Usage meters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MeterCard icon={HardDrive} meter={d.storage}>
          <div className="mt-3 flex gap-2">
            <StatChip label="Objects" value={formatCount(d.storage.totalObjects)} />
            <StatChip label="Buckets" value={String(d.storage.buckets)} />
          </div>
        </MeterCard>
        <MeterCard icon={Database} meter={d.database}>
          <div className="mt-3 flex gap-2">
            <StatChip label="Tables" value={String(d.database.tables)} />
            <StatChip label="Largest" value={d.database.topTables[0]?.name ?? "—"} />
          </div>
        </MeterCard>
        <MeterCard
          icon={Activity}
          meter={{
            label: "Request volume",
            usedLabel: `${formatCount(d.requests.events30d)} events`,
            quotaLabel: `${d.requests.perDayAvg}/day avg · 30-day window`,
            percent: null,
            status: d.requests.events30d === 0 ? "info" : d.requests.status,
          }}
        >
          <div className="mt-3 flex gap-2">
            <StatChip label="Page views" value={formatCount(d.requests.pageViews30d)} />
            <StatChip label="Admin actions" value={formatCount(d.requests.adminActions30d)} />
            <StatChip label="Leads" value={formatCount(d.requests.leads30d)} />
          </div>
        </MeterCard>
        <MeterCard
          icon={ArrowLeftRight}
          meter={{
            label: "Bandwidth",
            usedLabel: `${formatCount(d.bandwidth.downloads30d)} downloads`,
            quotaLabel: `${formatBytes(d.bandwidth.mediaBytes)} media hosted`,
            percent: null,
            status: d.bandwidth.status,
          }}
        >
          <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
            {d.bandwidth.detail}
          </p>
        </MeterCard>
      </div>

      {/* API usage + rate limit */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
                <Cpu className="h-3.5 w-3.5" />
              </span>
              API usage
            </CardTitle>
            <span className="text-muted-foreground text-xs">
              {d.api.totalCalls} total call{d.api.totalCalls === 1 ? "" : "s"}
            </span>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pt-0 pb-4">
            {d.api.integrations.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No integrations registered yet. Add providers in the{" "}
                <Link href="/admin/integrations" className="text-primary hover:underline">
                  Integration Center
                </Link>
                .
              </p>
            ) : (
              d.api.integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border-border/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-accent/50 text-muted-foreground flex h-6 w-6 items-center justify-center rounded-md">
                      <Cpu className="h-3 w-3" />
                    </span>
                    <span className="font-medium">{integration.label}</span>
                    {integration.maskedKey && (
                      <code className="bg-accent/50 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {integration.maskedKey}
                      </code>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span>
                      {integration.usageCount} call{integration.usageCount === 1 ? "" : "s"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        integration.configured ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          integration.configured ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {integration.configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </span>
                Rate limit status
              </CardTitle>
              <StatusBadge status={d.rateLimit.status} />
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <p className="text-xl font-bold tracking-tight">
                {d.rateLimit.measuredPerMinute}/min
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {d.rateLimit.detail}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
                  <Info className="h-3.5 w-3.5" />
                </span>
                Largest tables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 pt-0 pb-4">
              {d.database.topTables.length === 0 ? (
                <p className="text-muted-foreground text-xs">Database usage unavailable.</p>
              ) : (
                d.database.topTables.map((table) => {
                  const maxSize = d.database.topTables[0]?.sizeBytes || 1;
                  return (
                    <div key={table.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-medium">{table.name}</span>
                        <span className="text-muted-foreground">
                          {formatCount(table.rows)} rows · {formatBytes(table.sizeBytes)}
                        </span>
                      </div>
                      <div className="bg-accent h-1 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.max(4, (table.sizeBytes / maxSize) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service health detail */}
      <Card className="border-border/50">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            Service health
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 px-4 pt-0 pb-4 sm:grid-cols-2">
          {d.system.checks.map((check) => {
            const meta = getStatusMeta(check.status);
            return (
              <div
                key={check.label}
                className="border-border/40 bg-accent/30 flex items-start gap-3 rounded-lg border px-3 py-2.5"
              >
                <span className="mt-0.5 text-sm leading-none">{meta.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{check.label}</p>
                    <span
                      className={`text-[10px] font-medium ${meta.badge} rounded-full border px-1.5 py-0.5`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p
                    className="text-muted-foreground mt-0.5 text-xs leading-relaxed"
                    title={check.detail}
                  >
                    {check.detail}
                  </p>
                  {check.recommendedAction && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-amber-600">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{check.recommendedAction}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
