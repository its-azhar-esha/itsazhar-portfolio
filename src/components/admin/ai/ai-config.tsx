"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  KeyRound,
  Loader2,
  PlugZap,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/components/ui/toast";
import { saveAiConfigAction, testAiProviderAction } from "@/lib/ai/actions";
import type {
  AiConfigBundleWithKeyStatus,
  AiConfigWithKeyStatus,
  AiProviderKeyStatus,
} from "@/lib/ai/actions";
import type { AiConfig, AiProviderConfig, AiProviderId } from "@/types/settings";
import { cn } from "@/lib/utils";

const AUTO_MODEL = "__auto__";

const PROVIDER_META: Record<AiProviderId, { label: string; description: string; accent: string }> =
  {
    groq: {
      label: "Groq",
      description: "Fast LLM inference — great as the primary provider.",
      accent: "text-orange-400",
    },
    openrouter: {
      label: "OpenRouter",
      description: "Hundreds of models behind one API — ideal fallback.",
      accent: "text-blue-400",
    },
  };

const KNOWLEDGE_SOURCES: {
  key: keyof AiConfig["knowledge"];
  label: string;
  description: string;
}[] = [
  {
    key: "custom",
    label: "Custom Knowledge",
    description: "Your written bio, services, background and business details.",
  },
  {
    key: "website",
    label: "Website Content",
    description: "Site identity, hero and about sections.",
  },
  { key: "services", label: "Services", description: "Live services from the CMS." },
  { key: "projects", label: "Projects", description: "Live projects from the CMS." },
  { key: "blog", label: "Blog Posts", description: "Recent blog posts." },
  {
    key: "hub",
    label: "Hub & Playground",
    description: "Automation Hub resources and Playground templates.",
  },
  {
    key: "faq",
    label: "FAQs",
    description: "Bundled FAQ files used as fallback content.",
  },
];

function KeyStatusBadge({ status }: { status: AiProviderKeyStatus }) {
  if (status.configured && !status.envConfigured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
        <CheckCircle2 className="h-3 w-3" /> Key saved
        {status.maskedKey ? ` (${status.maskedKey})` : ""}
      </span>
    );
  }
  if (status.envConfigured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
        <CheckCircle2 className="h-3 w-3" /> Env key active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
      <AlertCircle className="h-3 w-3" /> No key
    </span>
  );
}

interface ProviderCardProps {
  provider: AiConfigWithKeyStatus["providers"][number];
  models: string[];
  testing: boolean;
  testMessage: string | null;
  testOk: boolean | null;
  onToggle: (enabled: boolean) => void;
  onModelChange: (model: string) => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTest: () => void;
}

function ProviderCard({
  provider,
  models,
  testing,
  testMessage,
  testOk,
  onToggle,
  onModelChange,
  onMove,
  canMoveUp,
  canMoveDown,
  onTest,
}: ProviderCardProps) {
  const meta = PROVIDER_META[provider.id];
  const modelOptions = [AUTO_MODEL, ...models];
  const modelValue = provider.model || AUTO_MODEL;

  return (
    <div className="border-border/50 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            )}
          >
            <Sparkles className={cn("h-4 w-4", meta.accent)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{meta.label}</p>
              <span className="text-muted-foreground text-xs">#{provider.priority}</span>
              <KeyStatusBadge status={provider.keyStatus} />
            </div>
            <p className="text-muted-foreground text-xs">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-5 w-6 items-center justify-center rounded disabled:opacity-30"
              aria-label="Move up in priority"
              title="Higher priority"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-5 w-6 items-center justify-center rounded disabled:opacity-30"
              aria-label="Move down in priority"
              title="Lower priority"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
          <Switch
            checked={provider.enabled}
            onCheckedChange={onToggle}
            aria-label={`Enable ${meta.label}`}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Model</Label>
          <SearchableSelect
            options={modelOptions}
            value={modelValue}
            onChange={(next) => onModelChange(next === AUTO_MODEL ? "" : String(next))}
            allowCustom={false}
            placeholder="Select a model..."
            searchPlaceholder="Search models..."
            emptyLabel="Test the connection to discover models"
            hint={
              provider.model
                ? "This model will be used for this provider."
                : "Auto — the fastest verified model for this provider."
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Connection</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={testing}
              className="gap-1.5"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" />
              )}
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Link
              href="/admin/integrations"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <KeyRound className="h-3 w-3" /> Manage key
            </Link>
          </div>
          {testMessage && (
            <p className={cn("text-xs", testOk ? "text-emerald-500" : "text-red-500")}>
              {testMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface AiConfigManagerProps {
  initial: AiConfigBundleWithKeyStatus;
}

export function AiConfigManager({ initial }: AiConfigManagerProps) {
  const toast = useToast();
  const [defaults] = React.useState(() => initial);
  const [form, setForm] = React.useState<AiConfigBundleWithKeyStatus>(() => initial);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = React.useState<
    Record<string, { ok: boolean; message: string }>
  >({});
  const [discoveredModels, setDiscoveredModels] = React.useState<Record<string, string[]>>({});

  const hasChanges = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(defaults),
    [form, defaults],
  );

  function patchConfig(partial: Omit<Partial<AiConfig>, "providers">) {
    setForm((prev) => ({ ...prev, ai_config: { ...prev.ai_config, ...partial } }));
  }

  function patchProviders(index: number, partial: Partial<AiProviderConfig>) {
    setForm((prev) => {
      const providers = prev.ai_config.providers.map((p, i) =>
        i === index ? { ...p, ...partial } : p,
      );
      return { ...prev, ai_config: { ...prev.ai_config, providers } };
    });
  }

  function moveProvider(index: number, direction: -1 | 1) {
    setForm((prev) => {
      const providers = [...prev.ai_config.providers];
      const target = index + direction;
      if (target < 0 || target >= providers.length) return prev;
      const current = providers[index];
      const next = providers[target];
      providers[index] = { ...next, priority: current.priority };
      providers[target] = { ...current, priority: next.priority };
      providers.sort((a, b) => a.priority - b.priority);
      return { ...prev, ai_config: { ...prev.ai_config, providers } };
    });
  }

  async function handleTest(provider: AiProviderConfig & { keyStatus: AiProviderKeyStatus }) {
    setTesting((prev) => ({ ...prev, [provider.id]: true }));
    setTestResults((prev) => ({ ...prev, [provider.id]: { ok: false, message: "" } }));
    try {
      const result = await testAiProviderAction({ id: provider.id });
      if (!result.success) {
        setTestResults((prev) => ({
          ...prev,
          [provider.id]: { ok: false, message: result.error },
        }));
        return;
      }
      setDiscoveredModels((prev) => ({ ...prev, [provider.id]: result.data.models }));
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          ok: true,
          message: `Connected in ${result.data.latencyMs}ms — ${result.data.models.length} models available.`,
        },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [provider.id]: false }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveAiConfigAction({
        ai_config: {
          enabled: form.ai_config.enabled,
          temperature: form.ai_config.temperature,
          maxTokens: form.ai_config.maxTokens,
          providers: form.ai_config.providers.map(({ id, enabled, model, priority }) => ({
            id,
            enabled,
            model,
            priority,
          })),
          knowledge: form.ai_config.knowledge,
        },
        custom_knowledge: form.custom_knowledge,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setForm((prev) => ({
        ai_config: {
          ...prev.ai_config,
          ...result.data.ai_config,
          providers: result.data.ai_config.providers.map((p) => ({
            ...p,
            keyStatus: prev.ai_config.providers.find((pp) => pp.id === p.id)?.keyStatus ?? {
              configured: false,
              maskedKey: null,
              envConfigured: false,
            },
          })),
        },
        custom_knowledge: result.data.custom_knowledge,
      }));
      toast.success("AI configuration saved.");
    } finally {
      setSaving(false);
    }
  }

  const sortedProviders = [...form.ai_config.providers].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <SectionCard
        title="AI Assistant"
        description="Master switch for the AI chat assistant (public chat + CMS assistant)."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">AI Assistant enabled</p>
            <p className="text-muted-foreground text-xs">
              When off, the public chat returns fallback knowledge only and the CMS assistant is
              disabled.
            </p>
          </div>
          <Switch
            checked={form.ai_config.enabled}
            onCheckedChange={(v) => patchConfig({ enabled: v })}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={form.ai_config.temperature}
              onChange={(e) =>
                patchConfig({ temperature: Math.min(2, Math.max(0, Number(e.target.value) || 0)) })
              }
            />
            <p className="text-muted-foreground text-xs">0 = deterministic, 2 = creative.</p>
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min={256}
              max={16384}
              step={256}
              value={form.ai_config.maxTokens}
              onChange={(e) =>
                patchConfig({
                  maxTokens: Math.min(
                    16384,
                    Math.max(256, Math.round(Number(e.target.value) || 0)),
                  ),
                })
              }
            />
            <p className="text-muted-foreground text-xs">Maximum response length per message.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Custom Knowledge"
        description="Everything here is always known to the AI — your bio, services, background, business details, or anything else the assistant should say."
      >
        <Textarea
          value={form.custom_knowledge}
          onChange={(e) => setForm((prev) => ({ ...prev, custom_knowledge: e.target.value }))}
          className="min-h-[220px] font-mono text-xs"
          placeholder={`# About me
I'm Azhar — AI Automation Specialist from Bangladesh...

## What I do best
- ...

## Business details
- Pricing: ...
- Process: ...`}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Markdown supported. {form.custom_knowledge.length.toLocaleString()} / 20,000 chars
          </p>
          <p className="text-muted-foreground text-xs">
            Included when the <span className="font-medium">Custom Knowledge</span> source is on.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Knowledge Sources"
        description="Choose which content the AI assistant can use when answering. Turn off anything you don't want shared with the AI."
      >
        <div className="divide-border/40 divide-y">
          {KNOWLEDGE_SOURCES.map((source) => (
            <div key={source.key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium">{source.label}</p>
                <p className="text-muted-foreground text-xs">{source.description}</p>
              </div>
              <Switch
                checked={form.ai_config.knowledge[source.key]}
                onCheckedChange={(v) =>
                  patchConfig({
                    knowledge: { ...form.ai_config.knowledge, [source.key]: v },
                  })
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="AI Providers"
        description="Ordered fallback chain — the first enabled provider answers, the next one takes over when it fails. Keys are managed on the Integrations page."
      >
        <div className="space-y-4">
          {sortedProviders.map((provider, index) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              models={discoveredModels[provider.id] || []}
              testing={testing[provider.id] === true}
              testMessage={testResults[provider.id]?.message || null}
              testOk={testResults[provider.id]?.ok ?? null}
              onToggle={(enabled) => patchProviders(index, { enabled })}
              onModelChange={(model) => patchProviders(index, { model })}
              onMove={(direction) => moveProvider(index, direction)}
              canMoveUp={index > 0}
              canMoveDown={index < sortedProviders.length - 1}
              onTest={() => handleTest(provider)}
            />
          ))}
        </div>
      </SectionCard>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm(defaults)}
            disabled={saving || !hasChanges}
            className="gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        {hasChanges && !saving && <span className="text-xs text-amber-500">Unsaved changes</span>}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="border-border/40 border-b pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}
