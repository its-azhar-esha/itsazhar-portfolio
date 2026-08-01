"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeepAliveComponent, KeepAliveStatus } from "@/lib/keepalive/actions";

export const STATUS_META: Record<KeepAliveStatus, { label: string; emoji: string; badge: string }> =
  {
    ok: {
      label: "Healthy",
      emoji: "🟢",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    },
    warn: {
      label: "Warning",
      emoji: "🟡",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    },
    error: {
      label: "Error",
      emoji: "🔴",
      badge: "border-red-500/30 bg-red-500/10 text-red-500",
    },
    info: {
      label: "Info",
      emoji: "ℹ️",
      badge: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    },
  };

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="border-border/40 flex items-start justify-between gap-3 border-b py-1.5 last:border-0">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      <span
        className={cn(
          "text-right text-xs",
          emphasize ? "font-medium text-amber-600" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function KeepAliveCard({ component }: { component: KeepAliveComponent }) {
  const [open, setOpen] = React.useState(false);
  const meta = STATUS_META[component.status];
  const hasDetails = Boolean(
    component.whatHappened ||
    component.lastError ||
    component.relatedLogs.length > 0 ||
    component.nextScheduledAt,
  );

  return (
    <div className="border-border/50 bg-card rounded-xl border shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="mt-0.5 text-base leading-none">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{component.name}</p>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{component.detail}</p>
        </div>
        {hasDetails && (
          <ChevronDown
            className={cn(
              "text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-border/40 border-t px-4 py-3">
              <div className="grid gap-x-6 sm:grid-cols-2">
                <div>
                  <Row label="Keep-alive performed" value={fmt(component.lastKeepAliveAt)} />
                  <Row label="Next scheduled" value={fmt(component.nextScheduledAt)} />
                  <Row label="Last health check" value={fmt(component.lastHealthCheckAt)} />
                  <Row label="Last success" value={fmt(component.lastSuccessAt)} />
                  <Row
                    label="Last error"
                    value={component.lastError ? fmt(component.lastErrorAt) : "—"}
                    emphasize={Boolean(component.lastError)}
                  />
                  <Row label="Error detail" value={component.lastError ?? "—"} />
                </div>
                <div>
                  <Row label="Retry status" value={component.retryStatus ?? "—"} />
                  <Row
                    label="Failures"
                    value={
                      component.failureCount > 0 ? (
                        <span className="text-red-500">{component.failureCount}</span>
                      ) : (
                        component.failureCount
                      )
                    }
                  />
                  <Row
                    label="Success rate"
                    value={
                      component.successRate === null
                        ? "—"
                        : `${component.successRate}% (${component.successCount} ok)`
                    }
                  />
                  <Row label="Uptime" value={component.uptime ?? "—"} />
                  <Row
                    label="Response time"
                    value={
                      component.responseTimeMs === null ? "—" : `${component.responseTimeMs}ms`
                    }
                  />
                </div>
              </div>

              {component.whatHappened && (
                <div className="border-border/40 mt-3 space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                    {component.status === "error" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    Requires attention
                  </p>
                  <DetailLine label="What happened" value={component.whatHappened} />
                  <DetailLine label="Why" value={component.why ?? ""} />
                  <DetailLine label="Impact" value={component.impact ?? ""} />
                  {component.autoRecovered !== null && component.autoRecovered !== undefined && (
                    <DetailLine
                      label="Auto-recovery"
                      value={component.autoRecovered ? "Recovered automatically" : "Not recovered"}
                      warn={!component.autoRecovered}
                    />
                  )}
                  <DetailLine
                    label="Recommended action"
                    value={component.recommendedAction ?? ""}
                  />
                </div>
              )}

              {component.relatedLogs.length > 0 && (
                <div className="mt-3">
                  <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                    Recent logs
                  </p>
                  <div className="border-border/40 divide-border/40 max-h-44 divide-y overflow-y-auto rounded-lg border text-xs">
                    {component.relatedLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                        {log.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        <span className="text-muted-foreground shrink-0">
                          {new Date(log.at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="truncate">{log.detail || (log.ok ? "ok" : "failed")}</span>
                        {log.latencyMs !== null && (
                          <span className="text-muted-foreground ml-auto shrink-0">
                            {log.latencyMs}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailLine({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <p className="text-xs leading-relaxed">
      <span className="font-semibold text-amber-600">{label}:</span>{" "}
      <span className={cn("text-amber-700", warn && "text-red-500")}>{value}</span>
    </p>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs leading-relaxed">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
      {children}
    </div>
  );
}
