"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { HelpButton } from "@/components/ui/help-dialog";
import { saveMonitoringConfigAction } from "@/lib/monitoring/actions";
import { CheckCircle2, Globe, Loader2, Plus, Save, Trash2, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitoringConfig, MonitoringWebhook } from "@/types/settings";

function FieldLabel({ label, help }: { label: string; help: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <HelpButton helpId={help} label={`Help about ${label}`} />
    </span>
  );
}

function newWebhookId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `wh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function MonitoringConfigCard({
  initial,
  effectiveSiteUrl,
  effectiveHealthUrl,
  effectiveBackupUrl,
}: {
  initial: MonitoringConfig;
  effectiveSiteUrl: string;
  effectiveHealthUrl: string;
  effectiveBackupUrl: string;
}) {
  const [config, setConfig] = React.useState<MonitoringConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const dirty = React.useMemo(
    () => JSON.stringify(config) !== JSON.stringify(initial),
    [config, initial],
  );

  const update = (partial: Partial<MonitoringConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }));

  const updateWebhook = (id: string, partial: Partial<MonitoringWebhook>) =>
    setConfig((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) => (w.id === id ? { ...w, ...partial } : w)),
    }));

  const addWebhook = () =>
    setConfig((prev) => ({
      ...prev,
      webhooks: [...prev.webhooks, { id: newWebhookId(), name: "Webhook", url: "", enabled: true }],
    }));

  const removeWebhook = (id: string) =>
    setConfig((prev) => ({ ...prev, webhooks: prev.webhooks.filter((w) => w.id !== id) }));

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveMonitoringConfigAction(config as unknown as Record<string, unknown>);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setConfig(result.data);
      toast.success("Monitoring & domain settings saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Globe className="h-3.5 w-3.5" />
          </span>
          Domain & monitoring
          <HelpButton helpId="monitoring-config" label="Help about domain & monitoring settings" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-4 pt-3 pb-4">
        <div className="space-y-2">
          <FieldLabel label="Canonical site URL" help="monitoring-site-url" />
          <Input
            placeholder={`Default: ${effectiveSiteUrl}`}
            value={config.siteUrl}
            onChange={(e) => update({ siteUrl: e.target.value })}
          />
          <p className="text-muted-foreground text-xs">
            Used for SEO canonicals, sitemap and robots.txt. Leave empty to keep using the current
            default (<code className="bg-accent/50 rounded px-1">{effectiveSiteUrl}</code>). Change
            this when your permanent domain (e.g. itsazhar.com) goes live — no code changes needed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel label="Health check URL" help="monitoring-health-url" />
            <Input
              placeholder={`${effectiveSiteUrl}/api/health`}
              value={config.healthCheckUrl}
              onChange={(e) => update({ healthCheckUrl: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              Override for uptime monitors. Currently resolving to{" "}
              <code className="bg-accent/50 rounded px-1">{effectiveHealthUrl}</code>.
            </p>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Backup URL" help="monitoring-backup-url" />
            <Input
              placeholder={`${effectiveSiteUrl}/api/backup`}
              value={config.backupUrl}
              onChange={(e) => update({ backupUrl: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              Override for backup triggers. Currently resolving to{" "}
              <code className="bg-accent/50 rounded px-1">{effectiveBackupUrl}</code>.
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <Webhook className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Failure webhooks</span>
            <HelpButton helpId="monitoring-webhooks" label="Help about failure webhooks" />
          </div>
          <p className="text-muted-foreground text-xs">
            Notified (POST) whenever /api/health or /api/backup reports a failure. Useful for Slack,
            Discord or any webhook URL.
          </p>
          {config.webhooks.length === 0 ? (
            <p className="text-muted-foreground border-border/40 rounded-lg border border-dashed p-3 text-center text-xs">
              No webhooks configured.
            </p>
          ) : (
            <div className="space-y-2">
              {config.webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border-border/40 grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto_auto]"
                >
                  <Input
                    placeholder="Name"
                    value={webhook.name}
                    onChange={(e) => updateWebhook(webhook.id, { name: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="https://hooks.slack.com/..."
                    value={webhook.url}
                    onChange={(e) => updateWebhook(webhook.id, { url: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-xs">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(v) => updateWebhook(webhook.id, { enabled: v })}
                    />
                    Enabled
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => removeWebhook(webhook.id)}
                    aria-label={`Remove webhook ${webhook.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={addWebhook} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add webhook
          </Button>
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
