"use client";

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { AnalysisItem, AnalysisLevel } from "@/lib/seo/analysis";

const ICONS: Record<AnalysisLevel, React.ComponentType<{ className?: string }>> = {
  good: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const COLORS: Record<AnalysisLevel, string> = {
  good: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-red-500",
  info: "text-blue-500",
};

const BG_COLORS: Record<AnalysisLevel, string> = {
  good: "bg-emerald-500/10 border-emerald-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  error: "bg-red-500/10 border-red-500/20",
  info: "bg-blue-500/10 border-blue-500/20",
};

function AnalysisRow({ item }: { item: AnalysisItem }) {
  const Icon = ICONS[item.level];
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${BG_COLORS[item.level]}`}
    >
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${COLORS[item.level]}`} />
      <span className="text-foreground">{item.message}</span>
    </div>
  );
}

interface SeoAnalysisPanelProps {
  items: { label: string; item: AnalysisItem }[];
  overall?: AnalysisLevel;
}

export function SeoAnalysisPanel({ items, overall }: SeoAnalysisPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {overall && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Overall:</span>
          <span className={`text-xs font-semibold ${COLORS[overall]}`}>
            {overall.charAt(0).toUpperCase() + overall.slice(1)}
          </span>
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((entry) => (
          <div key={entry.label} className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              {entry.label}
            </span>
            <AnalysisRow item={entry.item} />
          </div>
        ))}
      </div>
    </div>
  );
}
