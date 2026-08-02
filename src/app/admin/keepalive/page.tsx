import type { Metadata } from "next";
import { AlertTriangle, Activity, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKeepAliveReportAction, type KeepAliveComponent } from "@/lib/keepalive/actions";
import { KeepAliveCard, InfoNote } from "@/components/admin/keepalive/keepalive-card";
import { STATUS_META } from "@/lib/keepalive/status-meta";
import { humanAge } from "@/lib/keepalive/freshness";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Keep-Alive | Admin" };

const GROUP_ORDER: KeepAliveComponent["group"][] = [
  "Infrastructure",
  "Data tables",
  "Storage buckets",
  "Functions",
  "Scheduled jobs",
  "Keep-alive services",
  "Health checks",
  "Backups",
];

export default async function KeepAlivePage() {
  const result = await getKeepAliveReportAction();

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Could not load keep-alive report</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const r = result.data;
  const generated = new Date(r.generatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    items: r.components.filter((c) => c.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keep-Alive</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete visibility into every component that keeps this project active.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">Generated {generated}</p>
      </div>

      {/* Summary banner */}
      <Card
        className={`border-border/50 ${
          r.operational
            ? "to-background bg-gradient-to-br from-emerald-500/10"
            : "to-background bg-gradient-to-br from-amber-500/10"
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {r.operational ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              {r.operational
                ? "All keep-alive components healthy"
                : "Some components need attention"}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {r.summary.healthy > 0 && (
                <SummaryChip status="ok" count={r.summary.healthy} label="healthy" />
              )}
              {r.summary.warning > 0 && (
                <SummaryChip status="warn" count={r.summary.warning} label="warning" />
              )}
              {r.summary.error > 0 && (
                <SummaryChip status="error" count={r.summary.error} label="error" />
              )}
              {r.summary.info > 0 && (
                <SummaryChip status="info" count={r.summary.info} label="info" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              {r.summary.streakDays} consecutive day(s) healthy
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Last successful check {humanAge(r.summary.lastOkAt, new Date())}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3 w-3" />
              Record checks: {r.summary.recordEnabled ? "enabled" : "disabled"}
            </span>
          </div>
        </CardHeader>
      </Card>

      <InfoNote>
        This project keeps itself alive with <strong>external schedulers</strong>: Vercel cron hits{" "}
        <code className="bg-accent/50 rounded px-1">/api/health</code> (daily 12:00 UTC) and{" "}
        <code className="bg-accent/50 rounded px-1">/api/backup</code> (daily 00:00 UTC), with
        GitHub Actions workflows (keepalive + backup-to-branch) as redundant fallbacks. There are no
        Supabase pg_cron jobs or edge functions for keep-alive; that is by design.
      </InfoNote>

      {!r.summary.recordEnabled && (
        <InfoNote>
          Health-check recording is currently disabled in Developer Tools settings, so the daily{" "}
          <code className="bg-accent/50 rounded px-1">/api/health</code> run will not write ledger
          rows and uptime/streak cannot be tracked. Re-enable &ldquo;Record keep-alive checks&rdquo;
          to restore monitoring.
        </InfoNote>
      )}

      {groups.map(({ group, items }) => (
        <section key={group}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {group}
            <span className="text-muted-foreground text-xs font-normal">
              {items.length} {items.length === 1 ? "component" : "components"}
            </span>
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <KeepAliveCard key={item.id} component={item} />
            ))}
          </div>
        </section>
      ))}

      <Card className="border-border/50">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <Info className="h-3.5 w-3.5" />
            </span>
            How to read this page
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4">
          <ul className="text-muted-foreground space-y-1.5 text-xs leading-relaxed">
            <li>🟢 Healthy / operational — no action needed.</li>
            <li>
              🟡 Warning / needs attention — review the highlighted details and recommended action.
            </li>
            <li>
              🔴 Error / unavailable — the component failed a probe; follow the recommended action.
            </li>
            <li>
              ℹ️ Info — informational, usually because data isn&apos;t available yet (e.g. no checks
              recorded).
            </li>
            <li>
              Click any card to expand full details: last keep-alive, next scheduled run, response
              times, success rate, uptime, recent logs, and failure explanations with recovery and
              recommended actions.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryChip({
  status,
  count,
  label,
}: {
  status: keyof typeof STATUS_META;
  count: number;
  label: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.info;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}
    >
      {meta.emoji} {count} {label}
    </span>
  );
}
