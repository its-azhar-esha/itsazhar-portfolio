"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import type { PlanEnvelope, PlanActionPreview, PlanActionResult } from "@/lib/ai/tools/types";
import { SlideToConfirm } from "@/components/ui/slide-to-confirm";
import { formatDateTimeBD } from "@/lib/format/dates";

interface PlanPreviewProps {
  plan: PlanEnvelope;
  applying: boolean;
  results: PlanActionResult[] | null;
  onApprove: () => void;
  onDiscard: () => void;
}

export function PlanPreview({ plan, applying, results, onApprove, onDiscard }: PlanPreviewProps) {
  const hasError = plan.actions.some((a) => a.error);

  return (
    <div className="border-border/60 mt-3 overflow-hidden rounded-xl border">
      <div className="border-border/40 bg-muted/40 flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md">
            <ClipboardList className="text-primary h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold">Change plan — review before applying</p>
            <p className="text-muted-foreground text-[10px]">
              {plan.actions.length} action{plan.actions.length === 1 ? "" : "s"} · nothing is
              applied until you confirm · expires {formatDateTimeBD(plan.expiresAt)}
            </p>
          </div>
        </div>
        {!applying && !results && (
          <button
            onClick={onDiscard}
            disabled={applying}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Discard
          </button>
        )}
      </div>

      <div className="space-y-4 px-4 py-3">
        {plan.explanation.trim() ? (
          <p className="text-muted-foreground text-xs leading-relaxed">{plan.explanation}</p>
        ) : null}

        {hasError && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-[11px] text-amber-600">
              Some actions could not be previewed against the live data. Fix the details below
              before approving.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {plan.actions.map((action, i) => (
            <ActionRow key={`${action.toolId}-${i}`} action={action} />
          ))}
        </div>

        {results ? (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                  r.ok
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold">{r.label}</p>
                  <p className="text-muted-foreground text-[11px]">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <SlideToConfirm
                label="Slide to apply all changes"
                onConfirm={onApprove}
                disabled={applying || hasError}
              />
            </div>
            {applying && (
              <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
            )}
          </div>
        )}
      </div>

      {!results && (
        <div className="border-border/40 flex items-center gap-1.5 border-t px-4 py-2">
          <ShieldCheck className="text-muted-foreground h-3 w-3" />
          <p className="text-muted-foreground text-[10px]">
            Applying records an audit entry and sends a Telegram notification.
          </p>
        </div>
      )}
    </div>
  );
}

function ActionRow({ action }: { action: PlanActionPreview }) {
  return (
    <div className="border-border/50 rounded-lg border px-3 py-2.5">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="bg-muted text-foreground/80 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          {action.module}
        </span>
        <span className="text-xs font-semibold">{action.label}</span>
      </div>
      {action.error ? (
        <div className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-600">
          {action.error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PreviewColumn title="Before" lines={action.before} tone="muted" />
          <div className="hidden items-center justify-center sm:flex">
            <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
          </div>
          <PreviewColumn title="After" lines={action.after} tone="accent" />
        </div>
      )}
    </div>
  );
}

function PreviewColumn({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: string[];
  tone: "muted" | "accent";
}) {
  const list = lines.length > 0 ? lines : ["—"];
  return (
    <div className="min-w-0">
      <p
        className={`mb-1 text-[10px] font-semibold tracking-wide uppercase ${
          tone === "accent" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {title}
      </p>
      <div className="space-y-0.5">
        {list.map((line, i) => (
          <p key={i} className="text-muted-foreground truncate text-[11px]" title={line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
