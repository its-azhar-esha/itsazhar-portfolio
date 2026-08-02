"use client";

import * as React from "react";
import { History, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { listContentVersionsAction, restoreContentVersionAction } from "@/lib/versions/actions";
import type { ContentVersion } from "@/lib/versions/repository";
import { formatDateTimeBD } from "@/lib/format/dates";

interface VersionHistoryProps {
  entity: string;
  entityId: string;
  onRestored?: () => void;
}

function formatDate(iso: string): string {
  return formatDateTimeBD(iso);
}

function summarize(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof data.title === "string") parts.push(data.title);
  if (typeof data.status === "string") parts.push(data.status);
  return parts.join(" · ") || "Snapshot";
}

export function VersionHistory({ entity, entityId, onRestored }: VersionHistoryProps) {
  const [versions, setVersions] = React.useState<ContentVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = React.useState<ContentVersion | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  async function load() {
    setLoading(true);
    setError(null);
    const result = await listContentVersionsAction(entity, entityId);
    if (result.success) {
      setVersions(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    let cancelled = false;
    async function fetchVersions() {
      const result = await listContentVersionsAction(entity, entityId);
      if (cancelled) return;
      if (result.success) {
        setVersions(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    void fetchVersions();
    return () => {
      cancelled = true;
    };
  }, [entity, entityId]);

  async function handleRestore() {
    if (!restoreTarget) return;
    setRestoring(restoreTarget.id);
    const result = await restoreContentVersionAction(entity, restoreTarget.id);
    setRestoring(null);
    setRestoreTarget(null);
    if (result.success) {
      setMessage({ type: "success", text: `Restored version ${result.data.version}.` });
      onRestored?.();
      await load();
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="text-muted-foreground h-4 w-4" />
          <h3 className="text-sm font-semibold">Version History</h3>
        </div>
        {!loading && versions.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {versions.length} {versions.length === 1 ? "snapshot" : "snapshots"}
          </Badge>
        )}
      </div>

      {message && (
        <p
          className={`text-xs ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}
        >
          {message.text}
        </p>
      )}

      {loading && <p className="text-muted-foreground text-xs">Loading history…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && versions.length === 0 && (
        <p className="text-muted-foreground border-border/40 rounded-lg border border-dashed p-4 text-xs">
          No snapshots yet. A new version is captured every time this item is saved.
        </p>
      )}

      {versions.length > 0 && (
        <div className="space-y-2">
          {versions.map((v) => {
            const isOpen = expanded === v.id;
            const isLatest = v.version === versions[0].version;
            return (
              <div key={v.id} className="border-border/40 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : v.id)}
                  className="hover:bg-accent/30 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                >
                  <Badge variant={isLatest ? "default" : "secondary"} className="text-[10px]">
                    v{v.version}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{summarize(v.data)}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {formatDate(v.createdAt)}
                      {v.createdBy ? "" : " · system"}
                    </p>
                  </div>
                  {!isLatest && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestoreTarget(v);
                      }}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  )}
                  <ChevronDown
                    className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <pre className="text-muted-foreground border-border/40 bg-muted/30 max-h-72 overflow-auto rounded-b-lg border-t p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(v.data, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={restoreTarget !== null}
        title="Restore this version?"
        description="The current content will be replaced with this snapshot. A new version is captured automatically, so nothing is permanently lost."
        confirmLabel={restoring ? "Restoring…" : "Restore"}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </div>
  );
}
