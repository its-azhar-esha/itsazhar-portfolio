import type { Metadata } from "next";
import {
  Activity,
  Archive,
  CheckCircle2,
  Database,
  ExternalLink,
  FileWarning,
  Globe,
  HardDrive,
  HeartPulse,
  Link2,
  SearchCheck,
  ShieldCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { getDxReportAction } from "@/lib/dx/actions";
import type { CheckStatus } from "@/lib/dx/actions";
import { getSettings } from "@/lib/settings/repository";
import { DxConfigCard } from "@/components/admin/dx/config-card";
import { SectionCard } from "@/components/admin/section-card";
import { HelpButton } from "@/components/ui/help-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Developer Tools | Admin" };

const STATUS_STYLES: Record<CheckStatus, { label: string; cls: string }> = {
  ok: { label: "OK", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  warn: { label: "Warn", cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  error: { label: "Error", cls: "bg-red-500/10 text-red-500 border-red-500/30" },
  info: { label: "Info", cls: "bg-primary/10 text-primary border-primary/30" },
};

function StatusBadge({ status }: { status: CheckStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

function StatTile({
  label,
  value,
  help,
  tone,
}: {
  label: string;
  value: string;
  help: string;
  tone?: "ok" | "bad";
}) {
  return (
    <div
      className={cn(
        "border-border/50 bg-card rounded-xl border p-4",
        tone === "bad" && "border-red-500/30 bg-red-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-2xl font-bold tracking-tight",
            tone === "bad" ? "text-red-500" : tone === "ok" ? "text-emerald-500" : undefined,
          )}
        >
          {value}
        </span>
        <HelpButton helpId={help} label={`Help about ${label}`} />
      </div>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}

function Dot({ ok, title }: { ok: boolean; title: string }) {
  return (
    <span
      title={title}
      className={cn("h-3.5 w-3.5 rounded-[3px]", ok ? "bg-emerald-500/80" : "bg-red-500/80")}
    />
  );
}

export default async function DxPage() {
  const [result, settingsResult] = await Promise.all([getDxReportAction(), getSettings()]);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <p className="text-lg font-semibold">Could not run developer checks</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const r = result.data;
  const dxConfig = settingsResult.success ? settingsResult.data?.dx_config : undefined;
  const backupStale = r.backups.ageDays !== null && r.backups.ageDays > 3;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Health checks, schema drift, backups, broken references and SEO validation — everything
            that keeps the site running.
          </p>
        </div>
        <HelpButton helpId="dx-page" label="Help about the Developer Tools page" align="left" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Health checks failed"
          value={String(r.health.filter((h) => h.status !== "ok").length)}
          help="dx-health"
          tone={r.health.every((h) => h.status === "ok") ? "ok" : "bad"}
        />
        <StatTile
          label="Pending migrations"
          value={String(r.migrationStatus.pending.length)}
          help="dx-migrations"
          tone={r.migrationStatus.ok ? "ok" : "bad"}
        />
        <StatTile
          label="Keep-alive streak"
          value={`${r.keepAlive.streakDays}d`}
          help="dx-keepalive"
          tone={r.keepAlive.okToday || r.keepAlive.streakDays > 0 ? "ok" : "bad"}
        />
        <StatTile
          label="Last backup"
          value={
            r.backups.latest
              ? r.backups.ageDays === 0
                ? "today"
                : `${r.backups.ageDays}d ago`
              : "never"
          }
          help="dx-backup"
          tone={r.backups.ok ? "ok" : backupStale || !r.backups.latest ? "bad" : undefined}
        />
      </div>

      {dxConfig ? <DxConfigCard initial={dxConfig} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Health monitor" icon={Activity} help="dx-health">
          <ul className="space-y-2">
            {r.health.map((h) => (
              <li
                key={h.label}
                className="border-border/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{h.label}</span>
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  {h.detail}
                  <StatusBadge status={h.status} />
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Keep-alive history"
          icon={HeartPulse}
          help="dx-keepalive"
          right={<StatusBadge status={r.keepAlive.okToday ? "ok" : "warn"} />}
        >
          <p className="text-muted-foreground mb-3 text-xs">
            Daily /api/health checks (Vercel cron).{" "}
            {r.keepAlive.recordEnabled
              ? "Recording is enabled."
              : "Recording is disabled in the configuration."}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {r.keepAlive.recent.map((c) => (
              <Dot
                key={c.checked_on}
                ok={c.ok}
                title={`${c.checked_on}: ${c.ok ? "ok" : "failed"}${c.latency_ms != null ? ` (${c.latency_ms}ms)` : ""}`}
              />
            ))}
            {r.keepAlive.recent.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No checks recorded yet — the first /api/health cron run will appear here.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Backup status"
          icon={Archive}
          help="dx-backup"
          right={<StatusBadge status={r.backups.ok ? "ok" : backupStale ? "error" : "warn"} />}
        >
          {!r.backups.latest ? (
            <p className="text-muted-foreground text-sm">
              No backups yet. The nightly /api/backup cron exports every table to the{" "}
              <code className="font-mono">backups</code> storage bucket.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile
                  label={`Backup ${r.backups.latest.backup_date}`}
                  value={r.backups.ageDays === 0 ? "today" : `${r.backups.ageDays}d ago`}
                  help="dx-backup"
                  tone={r.backups.ok ? "ok" : backupStale ? "bad" : undefined}
                />
                <StatTile
                  label="Tables"
                  value={String(r.backups.latest.table_count)}
                  help="dx-backup"
                />
                <StatTile
                  label="Files"
                  value={String(r.backups.latest.file_count)}
                  help="dx-backup"
                />
                <StatTile
                  label="Size"
                  value={humanBytes(r.backups.latest.size_bytes)}
                  help="dx-backup"
                />
              </div>
              {backupStale && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Last backup is over 3 days old. Check that the Vercel cron and the GitHub backup
                  workflow are running.
                </p>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="RLS posture" icon={ShieldCheck} help="dx-rls">
          <p className="text-muted-foreground mb-3 text-xs">
            Every public table should have RLS enabled. Service-role-only tables (health_checks,
            backups) are intentionally policy-free.
          </p>
          <div className="border-border/40 divide-border/40 divide-y overflow-hidden rounded-lg border text-xs">
            {r.rls.map((row) => {
              const isLedger = row.table_name === "health_checks" || row.table_name === "backups";
              const atRisk = !row.rls_enabled;
              const locked = row.rls_enabled && row.policy_count === 0 && isLedger;
              return (
                <div key={row.table_name} className="flex items-center gap-2 px-3 py-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      atRisk ? "bg-red-500" : "bg-emerald-500",
                    )}
                  />
                  <span className="font-mono">{row.table_name}</span>
                  <span className="text-muted-foreground ml-auto">
                    {!row.rls_enabled
                      ? "RLS DISABLED"
                      : locked
                        ? "locked (service role only)"
                        : `${row.policy_count} polic${row.policy_count === 1 ? "y" : "ies"}`}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Orphan storage files"
          icon={FileWarning}
          help="dx-orphans"
          right={<StatusBadge status={r.orphans.total === 0 ? "ok" : "warn"} />}
        >
          <p className="text-muted-foreground mb-3 text-xs">
            Files in storage not referenced by any media_files record.
          </p>
          {r.orphans.total === 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> No orphan files found.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium text-amber-500">
                {r.orphans.total} orphan file{r.orphans.total === 1 ? "" : "s"} (largest first).
              </p>
              <ul className="space-y-1.5">
                {r.orphans.items.map((file, i) => (
                  <li
                    key={`${file.bucket}-${file.path}-${i}`}
                    className="border-border/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
                  >
                    <span className="truncate font-mono">
                      {file.bucket}/{file.path}
                    </span>
                    <span className="text-muted-foreground ml-auto shrink-0">
                      {humanBytes(file.sizeBytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="Environment checker" icon={Globe} help="dx-env">
          <ul className="space-y-2">
            {r.environment.map((e) => (
              <li
                key={e.label}
                className="border-border/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{e.label}</span>
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span className="max-w-56 truncate">{e.detail}</span>
                  <StatusBadge status={e.status} />
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Migration status"
          icon={Database}
          help="dx-migrations"
          right={<StatusBadge status={r.migrationStatus.ok ? "ok" : "error"} />}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <StatTile
              label="Local"
              value={String(r.migrationStatus.local.length)}
              help="dx-migrations"
            />
            <StatTile
              label="Applied remotely"
              value={String(r.migrationStatus.applied.length)}
              help="dx-migrations"
            />
            <StatTile
              label="Pending"
              value={String(r.migrationStatus.pending.length)}
              help="dx-migrations"
              tone={r.migrationStatus.ok ? "ok" : "bad"}
            />
          </div>
          {r.migrationStatus.pending.length > 0 && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600">
              <p className="font-semibold">Pending migrations:</p>
              <ul className="mt-1 list-inside list-disc">
                {r.migrationStatus.pending.map((m) => (
                  <li key={m} className="font-mono">
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-1">
                Apply with <code className="font-mono">supabase db push</code>.
              </p>
            </div>
          )}
          {r.migrationStatus.unknown.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Applied remotely but not found locally: {r.migrationStatus.unknown.join(", ")}
            </p>
          )}
          {r.migrationStatus.ok && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Schema is in sync.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Storage status"
          icon={HardDrive}
          help="dx-storage"
          right={<StatusBadge status={r.storage.ok ? "ok" : "warn"} />}
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <StatTile label="Buckets" value={String(r.storage.buckets.length)} help="dx-storage" />
            <StatTile label="Objects" value={String(r.storage.totalObjects)} help="dx-storage" />
            <StatTile
              label="Total size"
              value={humanBytes(r.storage.totalBytes)}
              help="dx-storage"
            />
          </div>
          {r.storage.buckets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No buckets found.</p>
          ) : (
            <div className="border-border/40 divide-border/40 divide-y overflow-hidden rounded-lg border text-sm">
              {r.storage.buckets.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground flex items-center gap-3">
                    <span>{b.objects} objects</span>
                    <span>{humanBytes(b.sizeBytes)}</span>
                    <span>{b.public ? "public" : "private"}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Database status"
          icon={Database}
          help="dx-database"
          right={<StatusBadge status={r.database.ok ? "ok" : "error"} />}
        >
          <div className="border-border/40 divide-border/40 divide-y overflow-hidden rounded-lg border text-sm">
            {r.database.tables.map((t) => (
              <div key={t.name} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className="font-mono">{t.name}</span>
                <span className="text-muted-foreground">
                  {t.rows < 0 ? "unreachable" : `${t.rows.toLocaleString()} rows`}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Broken reference detector"
          icon={FileWarning}
          help="dx-brokenrefs"
          right={<StatusBadge status={r.brokenRefs.total === 0 ? "ok" : "error"} />}
        >
          {r.brokenRefs.total === 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> No broken media references found.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-red-500">
                {r.brokenRefs.total} reference{r.brokenRefs.total === 1 ? "" : "s"} point to missing
                media files.
              </p>
              <ul className="space-y-1.5">
                {r.brokenRefs.items.map((ref, i) => (
                  <li
                    key={`${ref.entity}-${i}`}
                    className="border-border/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span className="font-medium">{ref.entity}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono">{ref.field}</span>
                    <span
                      className="text-muted-foreground ml-auto truncate font-mono"
                      title={ref.value}
                    >
                      {ref.value}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="SEO validator" icon={SearchCheck} help="dx-seo-validator">
          {r.seo.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing to validate yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {r.seo.map((entry) => (
                <li key={entry.entity} className="border-border/40 rounded-lg border px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{entry.entity}</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            entry.score >= 85
                              ? "bg-emerald-500"
                              : entry.score >= 55
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                          style={{ width: `${entry.score}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-8 text-right text-xs font-semibold">
                        {entry.score}
                      </span>
                    </div>
                  </div>
                  {entry.issues.length > 0 ? (
                    <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                      {entry.issues.map((issue) => (
                        <li key={issue} className="flex items-start gap-1.5">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> No issues found.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Link checker"
          icon={Link2}
          help="dx-link-checker"
          right={<StatusBadge status={r.links.broken.length === 0 ? "ok" : "error"} />}
        >
          <p className="text-muted-foreground mb-3 text-xs">
            Checks booking/social links, purchase URLs, project demos and repos (live requests).
          </p>
          {r.links.total === 0 ? (
            <p className="text-muted-foreground text-sm">No links configured yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {r.links.broken.length === 0 && (
                <li className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All {r.links.ok} checked link{r.links.ok === 1 ? "" : "s"} respond OK.
                </li>
              )}
              {r.links.broken.map((link, i) => (
                <li
                  key={`${link.url}-${i}`}
                  className="border-border/40 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span className="font-medium">{link.label}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary ml-auto flex items-center gap-1 truncate font-mono"
                  >
                    {link.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <span className="shrink-0 font-semibold text-red-500">
                    {link.statusCode ? `HTTP ${link.statusCode}` : "unreachable"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Globe className="h-3.5 w-3.5" />
        This page runs real queries and outbound requests every time it loads.
      </p>
    </div>
  );
}

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
