"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { HelpButton } from "@/components/ui/help-dialog";
import { saveDxConfigAction } from "@/lib/dx/actions";
import { CheckCircle2, Loader2, Save, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DxConfig } from "@/types/settings";

function FieldLabel({ label, help }: { label: string; help: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <HelpButton helpId={help} label={`Help about ${label}`} />
    </span>
  );
}

export function DxConfigCard({ initial }: { initial: DxConfig }) {
  const [config, setConfig] = React.useState<DxConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const dirty = React.useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initial),
    [config, initial],
  );

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
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Settings2 className="h-3.5 w-3.5" />
          </span>
          Configuration
          <HelpButton helpId="dx-config" label="Help about the configuration" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-3 pb-4">
        <label className="border-border/40 flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            Record keep-alive checks
            <HelpButton
              helpId="dx-record-keepalive"
              label="Help about recording keep-alive checks"
            />
          </span>
          <Switch
            checked={config.recordHealthChecks}
            onCheckedChange={(v) => update({ recordHealthChecks: v })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel label="Link check timeout (ms)" help="dx-link-timeout" />
            <Input
              type="number"
              min={1000}
              max={30000}
              step={500}
              value={config.linkCheckTimeoutMs}
              onChange={(e) => update({ linkCheckTimeoutMs: Number(e.target.value) || 8000 })}
            />
            <p className="text-muted-foreground text-xs">
              How long each link check waits before giving up.
            </p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Max URLs checked" help="dx-link-maxurls" />
            <Input
              type="number"
              min={1}
              max={200}
              value={config.linkCheckMaxUrls}
              onChange={(e) => update({ linkCheckMaxUrls: Number(e.target.value) || 25 })}
            />
            <p className="text-muted-foreground text-xs">Cap on links validated per page load.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="SEO title max chars" help="dx-seo-titlemax" />
            <Input
              type="number"
              min={40}
              max={120}
              value={config.seoTitleMax}
              onChange={(e) => update({ seoTitleMax: Number(e.target.value) || 70 })}
            />
            <p className="text-muted-foreground text-xs">Title limit used by the SEO validator.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Meta description min chars" help="dx-seo-descmin" />
            <Input
              type="number"
              min={60}
              max={300}
              value={config.seoDescMin}
              onChange={(e) => update({ seoDescMin: Number(e.target.value) || 120 })}
            />
            <p className="text-muted-foreground text-xs">Minimum description length.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Meta description max chars" help="dx-seo-descmax" />
            <Input
              type="number"
              min={80}
              max={400}
              value={config.seoDescMax}
              onChange={(e) => update({ seoDescMax: Number(e.target.value) || 160 })}
            />
            <p className="text-muted-foreground text-xs">Maximum description length.</p>
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
