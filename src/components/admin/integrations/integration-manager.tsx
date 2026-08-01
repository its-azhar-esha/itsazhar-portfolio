"use client";

import * as React from "react";
import {
  Bot,
  CheckCircle2,
  Circle,
  Cpu,
  ExternalLink,
  Globe,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { saveIntegrationKeyAction, clearIntegrationKeyAction } from "@/lib/integrations/actions";
import type { IntegrationInfo, IntegrationId } from "@/lib/integrations/repository";

interface IntegrationManagerProps {
  initial: IntegrationInfo[];
}

/* Icon registry is keyed by the catalog `icon` value; unknown ids fall
   back to a generic icon so new integrations never break the UI. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  groq: Cpu,
  openrouter: Globe,
};

function IntegrationIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Bot;
  return (
    <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function IntegrationManager({ initial }: IntegrationManagerProps) {
  const [integrations, setIntegrations] = React.useState<IntegrationInfo[]>(initial);
  const [secret, setSecret] = React.useState<Record<string, string>>({});
  const [expires, setExpires] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<string | null>(null);
  const [clearing, setClearing] = React.useState<IntegrationInfo | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  async function handleSave(id: IntegrationId, label: string) {
    const value = secret[id] ?? "";
    if (!value.trim()) {
      setMessage({ type: "error", text: `Enter a key for ${label} first.` });
      return;
    }
    setSaving(id);
    setMessage(null);
    const expiresAt = expires[id] ? new Date(expires[id]).toISOString() : null;
    const result = await saveIntegrationKeyAction(id, value, expiresAt);
    setSaving(null);
    if (result.success) {
      setSecret((prev) => ({ ...prev, [id]: "" }));
      setExpires((prev) => ({ ...prev, [id]: "" }));
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                hasStoredKey: true,
                maskedKey: `${value.slice(0, 4)}••••••••••${value.slice(-4)}`,
                rotatedAt: new Date().toISOString(),
                expiresAt,
              }
            : i,
        ),
      );
      setMessage({ type: "success", text: `${label} key saved and encrypted.` });
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  async function handleClear() {
    if (!clearing) return;
    const target = clearing;
    setClearing(null);
    setMessage(null);
    const result = await clearIntegrationKeyAction(target.id);
    if (result.success) {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === target.id ? { ...i, hasStoredKey: false, maskedKey: null, expiresAt: null } : i,
        ),
      );
      setMessage({ type: "success", text: `${target.label} stored key removed.` });
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {integrations.map((integration) => {
        const source = integration.hasStoredKey
          ? "Stored key"
          : integration.envConfigured
            ? "Environment variable"
            : "Not configured";
        const sourceTone =
          integration.hasStoredKey || integration.envConfigured ? "success" : "muted";

        return (
          <Card key={integration.id} className="border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-4 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <IntegrationIcon name={integration.icon} />
                {integration.label}
              </CardTitle>
              <Badge
                variant={sourceTone === "success" ? "default" : "outline"}
                className="text-[10px]"
              >
                {source === "Not configured" ? (
                  <Circle className="mr-1 h-2.5 w-2.5" />
                ) : source === "Stored key" ? (
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                ) : (
                  <RefreshCcw className="mr-1 h-2.5 w-2.5" />
                )}
                {source}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pt-1 pb-4">
              <p className="text-muted-foreground text-xs">{integration.description}</p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-xs">Key:</span>
                <code className="bg-accent/50 text-foreground rounded-md px-2.5 py-1 font-mono text-xs">
                  {integration.maskedKey ?? "—"}
                </code>
                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs"
                  >
                    Get a key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`key-${integration.id}`}>{integration.keyLabel}</Label>
                  <Input
                    id={`key-${integration.id}`}
                    type="password"
                    autoComplete="off"
                    placeholder={
                      integration.hasStoredKey
                        ? "Stored key is masked — enter a new one to rotate"
                        : integration.envConfigured
                          ? "Leave blank to keep using the env fallback"
                          : `Paste ${integration.label} API key`
                    }
                    value={secret[integration.id] ?? ""}
                    onChange={(e) =>
                      setSecret((prev) => ({ ...prev, [integration.id]: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`expires-${integration.id}`}>Optional expiry date</Label>
                  <Input
                    id={`expires-${integration.id}`}
                    type="date"
                    value={expires[integration.id] ?? ""}
                    onChange={(e) =>
                      setExpires((prev) => ({ ...prev, [integration.id]: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    Used{" "}
                    <span className="text-foreground font-semibold">{integration.usageCount}</span>{" "}
                    times
                  </span>
                  <span>Last used: {formatDate(integration.lastUsedAt)}</span>
                  <span>Rotated: {formatDate(integration.rotatedAt)}</span>
                  <span>Expires: {formatDate(integration.expiresAt)}</span>
                </div>
                <div className="flex gap-2">
                  {integration.hasStoredKey && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setClearing(integration)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSave(integration.id, integration.label)}
                    disabled={saving === integration.id}
                  >
                    {saving === integration.id
                      ? "Saving…"
                      : integration.hasStoredKey
                        ? "Rotate key"
                        : "Save key"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <ConfirmDialog
        open={clearing !== null}
        title="Remove stored key?"
        description={`The ${clearing?.label ?? ""} key stored in this admin panel will be deleted. If an environment variable is set, the integration continues to work through the fallback.`}
        confirmLabel="Remove"
        onConfirm={handleClear}
        onCancel={() => setClearing(null)}
      />
    </div>
  );
}
