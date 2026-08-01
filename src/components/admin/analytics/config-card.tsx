"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { saveAnalyticsConfigAction } from "@/lib/analytics/actions";
import { Loader2, Save } from "lucide-react";
import type { AnalyticsConfig } from "@/types/settings";

export function AnalyticsConfigCard({ initial }: { initial: AnalyticsConfig }) {
  const [config, setConfig] = React.useState<AnalyticsConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

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
      <CardHeader>
        <CardTitle className="text-base">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Retention (days)</Label>
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
            <Label>Report window (days)</Label>
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
            <Label>&nbsp;</Label>
            <div className="flex items-center justify-between rounded-md border px-3 py-1.5">
              <span className="text-sm font-medium">Tracking enabled</span>
              <Switch
                checked={config.enabled}
                onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={config.trackSearchKeywords}
              onCheckedChange={(v) => setConfig((prev) => ({ ...prev, trackSearchKeywords: v }))}
            />
            Record hub search keywords
          </label>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
