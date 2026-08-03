"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  BarChart3,
  BellRing,
  Copy,
  Database,
  File,
  FileText,
  GitCommitHorizontal,
  HardDrive,
  HeartPulse,
  History,
  Image as ImageIcon,
  KeyRound,
  Link2Off,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  Workflow,
  X,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpButton } from "@/components/ui/help-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDateTimeShortBD } from "@/lib/format/dates";
import { formatBytes } from "@/lib/media/utils";
import {
  getCleanupOverviewAction,
  runCleanupScanAction,
  runCleanupAction,
} from "@/lib/cleanup/actions";
import type {
  CleanupCategoryMeta,
  CleanupItem,
  CleanupOverview,
  CleanupRequest,
  CleanupResult,
  CleanupRetentionMode,
  ScanResult,
  ScanState,
} from "@/lib/cleanup/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Image: ImageIcon,
  File,
  Copy,
  Archive,
  Database,
  HardDrive,
  History,
  KeyRound,
  BellRing,
  GitCommitHorizontal,
  BarChart3,
  Save,
  HeartPulse,
  Link2Off,
  FileText,
  Workflow,
};

const CARD_GROUPS: { id: string; label: string; order: string[] }[] = [
  {
    id: "media",
    label: "Media & Files",
    order: ["unused-images", "unused-files", "duplicate-media"],
  },
  {
    id: "storage",
    label: "Storage",
    order: ["orphan-objects", "empty-buckets", "old-backup-files"],
  },
  {
    id: "logs",
    label: "Logs & History",
    order: ["audit-log", "login-history", "notification-deliveries", "content-versions"],
  },
  {
    id: "content",
    label: "Content & Data",
    order: ["analytics-events", "backup-ledger", "health-checks", "stale-drafts", "user-workflows"],
  },
  { id: "references", label: "References", order: ["broken-refs"] },
];

interface CardState {
  scanning: boolean;
  cleaning: boolean;
  confirmOpen: boolean;
  expanded: boolean;
  mode: CleanupRetentionMode;
  value: string;
  liveItems: CleanupItem[] | null;
  liveResult: ScanResult | null;
}

type CategoryWithScan = CleanupCategoryMeta & { scan?: ScanState | null };

function defaultState(category: CleanupCategoryMeta): CardState {
  const defaultOption = category.retention?.[0];
  return {
    scanning: false,
    cleaning: false,
    confirmOpen: false,
    expanded: false,
    mode: defaultOption?.mode ?? "keep-days",
    value: String(defaultOption?.defaultValue ?? 90),
    liveItems: null,
    liveResult: null,
  };
}

function RetentionControl({
  category,
  state,
  onChange,
}: {
  category: CleanupCategoryMeta;
  state: CardState;
  onChange: (patch: Partial<CardState>) => void;
}) {
  const options = category.retention ?? [];
  if (options.length === 0) return null;
  const current = options.find((o) => o.mode === state.mode) ?? options[0];
  const isDays = current.mode === "keep-days";
  const label = isDays ? (current.daysLabel ?? "Days") : (current.recordsLabel ?? "Records");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-muted-foreground text-[11px] font-medium">Retention:</label>
      <select
        value={state.mode}
        onChange={(e) => {
          const next = options.find((o) => o.mode === e.target.value) ?? options[0];
          onChange({ mode: next.mode, value: String(next.defaultValue) });
        }}
        className="border-border/50 bg-background text-muted-foreground focus:border-primary h-7 max-w-56 rounded-md border px-2 text-xs outline-none"
        aria-label="Retention rule"
      >
        {options.map((o) => (
          <option key={o.mode} value={o.mode}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={current.min}
          max={current.max}
          value={state.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="border-border/50 bg-background focus:border-primary h-7 w-20 rounded-md border px-2 text-xs outline-none"
          aria-label={label}
        />
        <span className="text-muted-foreground text-[11px]">{label}</span>
      </div>
    </div>
  );
}

function ConfirmDialog({
  category,
  state,
  scan,
  onConfirm,
  onClose,
}: {
  category: CleanupCategoryMeta;
  state: CardState;
  scan: ScanResult | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const retentionLabel = (() => {
    const option = category.retention?.find((o) => o.mode === state.mode);
    if (!option) return "no retention filter";
    const value = Number(state.value);
    switch (state.mode) {
      case "keep-days":
        return `keep items newer than ${value} day(s)`;
      case "keep-records":
        return `keep the newest ${value} record(s)`;
      case "keep-latest":
        return "delete everything except the newest item";
      default:
        return option.label;
    }
  })();

  const items = state.liveItems ?? scan?.items ?? [];
  const shown = items.slice(0, 12);
  const total = scan?.total ?? items.length;

  return (
    <AnimatePresence>
      {state.confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="border-border/50 bg-background relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border p-6 shadow-xl"
          >
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">Clean up: {category.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  This will remove{" "}
                  <span className="text-foreground font-semibold">
                    {total} item(s)
                    {scan && scan.sizeBytes > 0 ? ` (${formatBytes(scan.sizeBytes)})` : ""}
                  </span>{" "}
                  with retention:{" "}
                  <span className="text-foreground font-semibold">{retentionLabel}</span>.
                </p>
              </div>
            </div>

            {category.dangerous && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This category is destructive — it permanently deletes the items listed below.
                  Nothing is recoverable after confirmation.
                </p>
              </div>
            )}

            {shown.length > 0 ? (
              <div className="border-border/40 mt-4 max-h-52 overflow-y-auto rounded-lg border">
                <ul className="divide-border/40 divide-y">
                  {shown.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium" title={item.name}>
                          {item.name}
                        </p>
                        {item.detail ? (
                          <p className="text-muted-foreground truncate text-[10px]">
                            {item.detail}
                          </p>
                        ) : null}
                      </div>
                      {item.sizeBytes ? (
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {formatBytes(item.sizeBytes)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {items.length > shown.length && (
                  <p className="text-muted-foreground border-t border-dashed px-3 py-2 text-[10px]">
                    …and {items.length - shown.length} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-xs">
                No candidate items found — nothing will be deleted.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={total === 0 || state.cleaning}
                onClick={onConfirm}
                className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                {state.cleaning ? "Cleaning…" : `Delete ${total} item(s)`}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CategoryCard({
  category,
  state,
  onChange,
  onRefresh,
  onCleanup,
  onOpenConfirm,
}: {
  category: CategoryWithScan;
  state: CardState;
  onChange: (patch: Partial<CardState>) => void;
  onRefresh: () => void;
  onCleanup: () => void;
  onOpenConfirm: () => void;
}) {
  const Icon = ICONS[category.icon] ?? HardDrive;
  const scan = category.scan;
  const status = state.liveResult?.status ?? scan?.status ?? "clean";
  const total = state.liveResult?.total ?? scan?.total ?? 0;
  const size = state.liveResult?.sizeBytes ?? scan?.sizeBytes ?? 0;
  const scannedAt = state.liveResult ? new Date().toISOString() : (scan?.scannedAt ?? null);

  return (
    <div className="border-border/50 bg-card flex h-full flex-col rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{category.title}</h3>
            <HelpButton helpId={category.helpId} label={`Help about ${category.title}`} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {category.dangerous && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500">
              Destructive
            </Badge>
          )}
          <StatusBadge status={status} total={total} />
        </div>
      </div>

      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{category.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Total items" value={String(total)} />
        <Stat label="Est. storage" value={size > 0 ? formatBytes(size) : "N/A"} />
        <Stat
          label="Last scan"
          value={scannedAt ? formatDateTimeShortBD(scannedAt) : "Never"}
          title={scannedAt ? `Scanned at ${scannedAt}` : "Scan this category first"}
        />
      </div>

      {state.liveResult && (
        <p
          className={cn(
            "mt-3 rounded-md px-2 py-1.5 text-[11px]",
            state.liveResult.status === "error"
              ? "bg-red-500/10 text-red-500"
              : state.liveResult.status === "issues"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-emerald-500/10 text-emerald-500",
          )}
        >
          {state.liveResult.message}
        </p>
      )}

      {category.retention && category.retention.length > 0 && (
        <div className="mt-4">
          <RetentionControl category={category} state={state} onChange={onChange} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={onRefresh}
          disabled={state.scanning}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", state.scanning && "animate-spin")} />
          {state.scanning ? "Scanning…" : "Refresh"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={onOpenConfirm}
          disabled={total === 0 || state.scanning}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Cleanup
        </Button>
        <button
          onClick={() => onChange({ expanded: !state.expanded })}
          className="text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1 text-[11px]"
        >
          {state.expanded ? "Hide" : "Show"} candidates
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", state.expanded && "rotate-180")}
          />
        </button>
      </div>

      {state.expanded && (
        <div className="border-border/40 mt-3 rounded-lg border">
          <ul className="divide-border/40 max-h-48 divide-y overflow-y-auto">
            {(state.liveItems ?? []).slice(0, 30).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium" title={item.name}>
                    {item.name}
                  </p>
                  {item.detail ? (
                    <p className="text-muted-foreground truncate text-[10px]">{item.detail}</p>
                  ) : null}
                </div>
                {item.sizeBytes ? (
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {formatBytes(item.sizeBytes)}
                  </span>
                ) : null}
              </li>
            ))}
            {state.liveItems?.length === 0 && (
              <li className="text-muted-foreground px-3 py-3 text-xs">No candidates.</li>
            )}
          </ul>
        </div>
      )}

      <ConfirmDialog
        category={category}
        state={state}
        scan={state.liveResult}
        onConfirm={onCleanup}
        onClose={() => onChange({ confirmOpen: false })}
      />
    </div>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="border-border/40 rounded-lg border px-2 py-1.5" title={title}>
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  );
}

function StatusBadge({ status, total }: { status: ScanState["status"]; total: number }) {
  const config = {
    clean: { label: "Clean", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    issues: {
      label: `${total} item(s)`,
      cls: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    },
    error: { label: "Error", cls: "bg-red-500/10 text-red-500 border-red-500/30" },
  }[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        config.cls,
      )}
    >
      {config.label}
    </span>
  );
}

export function StorageManager() {
  const toast = useToast();
  const [overview, setOverview] = React.useState<CleanupOverview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cardStates, setCardStates] = React.useState<Record<string, CardState>>({});

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await getCleanupOverviewAction();
        if (!active) return;
        if (!result.success) {
          setError(result.error);
          return;
        }
        setOverview(result.data);
        setCardStates((prev) => {
          const next = { ...prev };
          for (const cat of result.data.categories) {
            if (!next[cat.id]) next[cat.id] = defaultState(cat);
          }
          return next;
        });
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Failed to load cleanup overview");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const patchState = (id: string, patch: Partial<CardState>) =>
    setCardStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const refreshCategory = async (id: string) => {
    patchState(id, { scanning: true });
    try {
      const result = await runCleanupScanAction(id);
      if (!result.success) {
        toast.error(result.error);
        patchState(id, {
          scanning: false,
          liveResult: {
            ok: false,
            status: "error",
            total: 0,
            sizeBytes: 0,
            items: [],
            message: result.error,
          },
        });
        return;
      }
      const scan = result.data;
      patchState(id, { scanning: false, liveResult: scan, liveItems: scan.items });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              scannedAt: new Date().toISOString(),
              categories: prev.categories.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      scan: {
                        category: id,
                        scannedAt: new Date().toISOString(),
                        status: scan.status,
                        total: scan.total,
                        sizeBytes: scan.sizeBytes,
                        summary: { message: scan.message },
                      },
                    }
                  : c,
              ),
            }
          : prev,
      );
      if (scan.status === "issues") toast.info(scan.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
      patchState(id, { scanning: false });
    }
  };

  const cleanupCategory = async (id: string) => {
    const category = overview?.categories.find((c) => c.id === id);
    if (!category) return;
    const state = cardStates[id] ?? defaultState(category);
    patchState(id, { cleaning: true });
    try {
      const value = Number(state.value);
      const request: CleanupRequest | null =
        category.retention && category.retention.length > 0 ? { mode: state.mode, value } : null;
      const result = await runCleanupAction(id, request);
      if (!result.success) {
        toast.error(result.error);
        patchState(id, { cleaning: false, confirmOpen: false });
        return;
      }
      const outcome: CleanupResult = result.data;
      patchState(id, { cleaning: false, confirmOpen: false });
      toast.success(outcome.message);
      await refreshCategory(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cleanup failed");
      patchState(id, { cleaning: false, confirmOpen: false });
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading cleanup overview…</p>;
  }
  if (error || !overview) {
    return (
      <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
        <p className="text-lg font-semibold">Could not load storage overview</p>
        <p className="text-muted-foreground mt-2 text-sm">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const totalCandidates = overview.categories.reduce((s, c) => s + (c.scan?.total ?? 0), 0);
  const totalSize = overview.categories.reduce((s, c) => s + (c.scan?.sizeBytes ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile value={String(totalCandidates)} label="Total candidates across categories" />
        <SummaryTile
          value={totalSize > 0 ? formatBytes(totalSize) : "0 B"}
          label="Estimated reclaimable storage"
        />
        <SummaryTile
          value={overview.scannedAt ? formatDateTimeShortBD(overview.scannedAt) : "—"}
          label="Last scan time"
        />
      </div>

      {CARD_GROUPS.map((group) => {
        const cats = group.order
          .map((id) => overview.categories.find((c) => c.id === id))
          .filter((c): c is CategoryWithScan => Boolean(c));
        if (cats.length === 0) return null;
        return (
          <section key={group.id} className="space-y-3">
            <h2 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              {group.label}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {cats.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  state={cardStates[cat.id] ?? defaultState(cat)}
                  onChange={(patch) => patchState(cat.id, patch)}
                  onRefresh={() => void refreshCategory(cat.id)}
                  onCleanup={() => void cleanupCategory(cat.id)}
                  onOpenConfirm={() => {
                    if (!cardStates[cat.id]?.liveItems) void refreshCategory(cat.id);
                    patchState(cat.id, { confirmOpen: true });
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border/50 bg-card rounded-xl border p-4">
      <p className="text-2xl font-bold tracking-tight break-words">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}
