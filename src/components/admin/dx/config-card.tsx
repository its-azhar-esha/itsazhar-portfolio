"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { saveDxConfigAction } from "@/lib/dx/actions";
import { Loader2, Save } from "lucide-react";
import type { DxConfig } from "@/types/settings";

export function DxConfigCard({ initial }: { initial: DxConfig }) {
  const [config, setConfig] = React.useState<DxConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const update = (partial: Partial<DxConfig>) => setConfig((prev) => ({ ...prev, ...partial }));

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveDxConfigAction(config as unknown as Record<string, unknown>);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Developer tools settings saved.");
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
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Record keep-alive checks</p>
            <p className="text-muted-foreground text-xs">
              /api/health writes one row per day to the health_checks ledger.
            </p>
          </div>
          <Switch
            checked={config.recordHealthChecks}
            onCheckedChange={(v) => update({ recordHealthChecks: v })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Link check timeout (ms)</Label>
            <Input
              type="number"
              min={1000}
              max={30000}
              step={500}
              value={config.linkCheckTimeoutMs}
              onChange={(e) => update({ linkCheckTimeoutMs: Number(e.target.value) || 8000 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max URLs checked</Label>
            <Input
              type="number"
              min={1}
              max={200}
              value={config.linkCheckMaxUrls}
              onChange={(e) => update({ linkCheckMaxUrls: Number(e.target.value) || 25 })}
            />
          </div>
          <div className="space-y-2">
            <Label>SEO title max chars</Label>
            <Input
              type="number"
              min={40}
              max={120}
              value={config.seoTitleMax}
              onChange={(e) => update({ seoTitleMax: Number(e.target.value) || 70 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Meta description min chars</Label>
            <Input
              type="number"
              min={60}
              max={300}
              value={config.seoDescMin}
              onChange={(e) => update({ seoDescMin: Number(e.target.value) || 120 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Meta description max chars</Label>
            <Input
              type="number"
              min={80}
              max={400}
              value={config.seoDescMax}
              onChange={(e) => update({ seoDescMax: Number(e.target.value) || 160 })}
            />
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
