"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { HelpButton } from "@/components/ui/help-dialog";
import { saveAnalyticsConfigAction } from "@/lib/analytics/actions";
import { BarChart3, CheckCircle2, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsConfig } from "@/types/settings";

function FieldLabel({ label, help }: { label: string; help: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <HelpButton helpId={help} label={`Help about ${label}`} />
    </span>
  );
}

export function AnalyticsConfigCard({ initial }: { initial: AnalyticsConfig }) {
  const [config, setConfig] = React.useState<AnalyticsConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const dirty = React.useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initial),
    [config, initial],
  );

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveAnalyticsConfigAction(config as unknown as Record<string, unknown>);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Analytics settings saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <BarChart3 className="h-3.5 w-3.5" />
          </span>
          Configuration
          <HelpButton helpId="analytics-config" label="Help about the configuration" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-3 pb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <FieldLabel label="Retention (days)" help="analytics-retention" />
            <Input
              type="number"
              min={7}
              max={365}
              value={config.retentionDays}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  retentionDays: Math.min(365, Math.max(7, Number(e.target.value) || 90)),
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              Old events are deleted automatically by the nightly backup job.
            </p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Report window (days)" help="analytics-window" />
            <select
              className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
              value={config.windowDays}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, windowDays: Number(e.target.value) }))
              }
            >
              {[7, 14, 30, 60, 90].map((days) => (
                <option key={days} value={days}>
                  Last {days} days
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Tracking enabled" help="analytics-enabled" />
            <div className="border-border/40 flex items-center justify-between rounded-md border px-3 py-1.5">
              <span className="text-sm font-medium">{config.enabled ? "On" : "Off"}</span>
              <Switch
                checked={config.enabled}
                onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Record hub search keywords" help="analytics-keywords" />
            <div className="border-border/40 flex items-center justify-between rounded-md border px-3 py-1.5">
              <span className="text-sm font-medium">
                {config.trackSearchKeywords ? "On" : "Off"}
              </span>
              <Switch
                checked={config.trackSearchKeywords}
                onCheckedChange={(v) => setConfig((prev) => ({ ...prev, trackSearchKeywords: v }))}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs",
              dirty ? "text-amber-500" : "text-emerald-500",
            )}
          >
            {dirty ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                All changes saved
              </>
            )}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
