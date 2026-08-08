"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { MediaField } from "@/components/media/media-field";
import { savePageContentAction } from "@/lib/content/actions";
import { isPlainObject } from "@/lib/content/merge";
import type { GroupDef } from "@/lib/content/schemas";

interface PageContentEditorProps {
  pageKey: string;
  pageTitle: string;
  description: string;
  initial: Record<string, unknown>;
  groups: GroupDef[];
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (isPlainObject(acc)) return acc[part];
    return undefined;
  }, obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!isPlainObject(current[parts[i]])) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function asLinks(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isPlainObject)
    .map((v) => ({ label: asString(v.label), href: asString(v.href) }));
}

function asSections(value: unknown): { title: string; body: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isPlainObject)
    .map((v) => ({ title: asString(v.title), body: asString(v.body) }));
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
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

export function PageContentEditor({
  pageKey,
  pageTitle,
  description,
  initial,
  groups,
}: PageContentEditorProps) {
  const router = useRouter();
  const [content, setContent] = React.useState<Record<string, unknown>>(() => initial);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges = React.useMemo(
    () => JSON.stringify(content) !== JSON.stringify(initial),
    [content, initial],
  );

  React.useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage({ type, text });
    messageTimer.current = setTimeout(() => setMessage(null), 4000);
  }

  function updateAt(path: string, value: unknown) {
    setContent((prev) => {
      const next = structuredClone(prev);
      setByPath(next, path, value);
      return next;
    });
    if (message) setMessage(null);
  }

  function updateLinkAt(path: string, index: number, patch: { label?: string; href?: string }) {
    const links = asLinks(getByPath(content, path));
    const next = links.map((link, i) => (i === index ? { ...link, ...patch } : link));
    updateAt(path, next);
  }

  function updateSectionAt(path: string, index: number, patch: { title?: string; body?: string }) {
    const sections = asSections(getByPath(content, path));
    const next = sections.map((section, i) => (i === index ? { ...section, ...patch } : section));
    updateAt(path, next);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await savePageContentAction({ key: pageKey, content });
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      showMessage("success", "Page content saved successfully.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/content");
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/30 bg-red-500/10 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="border-border/40 border-b pb-4">
          <CardTitle className="text-base">{pageTitle} Editor</CardTitle>
          {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {groups.map((group) => (
            <SectionCard key={group.title} title={group.title} description={group.description}>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={getByPath(content, field.key)}
                    onChange={(value) => updateAt(field.key, value)}
                    onLinkChange={(index, patch) => updateLinkAt(field.key, index, patch)}
                    onSectionChange={(index, patch) => updateSectionAt(field.key, index, patch)}
                  />
                ))}
              </div>
            </SectionCard>
          ))}
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {hasChanges && !saving && <span className="text-xs text-amber-500">Unsaved changes</span>}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  onLinkChange,
  onSectionChange,
}: {
  field: {
    key: string;
    label: string;
    hint?: string;
    type?: "text" | "textarea" | "tags" | "links" | "media" | "sections";
  };
  value: unknown;
  onChange: (value: unknown) => void;
  onLinkChange: (index: number, patch: { label?: string; href?: string }) => void;
  onSectionChange: (index: number, patch: { title?: string; body?: string }) => void;
}) {
  const type = field.type ?? "text";
  const id = `field-${field.key.replace(/\./g, "-")}`;

  if (type === "media") {
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>{field.label}</Label>
        <MediaField
          value={asString(value) || null}
          onChange={(v) => onChange(v)}
          typeFilter="image"
        />
        {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
      </div>
    );
  }

  if (type === "sections") {
    const sections = asSections(value);
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>{field.label}</Label>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="border-border/50 bg-card/50 space-y-2 rounded-lg border p-4">
              <Input
                value={section.title}
                onChange={(e) => onSectionChange(i, { title: e.target.value })}
                placeholder="Section title"
              />
              <Textarea
                value={section.body}
                onChange={(e) => onSectionChange(i, { body: e.target.value })}
                placeholder="Section body"
                className="min-h-[90px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => onChange(sections.filter((_, index) => index !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove section
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onChange([...sections, { title: "", body: "" }])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </Button>
        </div>
        {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[90px]"
        />
        {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
      </div>
    );
  }

  if (type === "tags") {
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>{field.label}</Label>
        <TagInput value={asStringArray(value)} onChange={onChange} />
        {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
      </div>
    );
  }

  if (type === "links") {
    const links = asLinks(value);
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>{field.label}</Label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={link.label}
                onChange={(e) => onLinkChange(i, { label: e.target.value })}
                placeholder="Label"
                className="flex-1"
              />
              <Input
                value={link.href}
                onChange={(e) => onLinkChange(i, { href: e.target.value })}
                placeholder="/page"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(links.filter((_, index) => index !== i))}
                aria-label={`Remove ${link.label || "link"}`}
              >
                <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onChange([...links, { label: "", href: "" }])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add link
          </Button>
        </div>
        {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      <Input id={id} value={asString(value)} onChange={(e) => onChange(e.target.value)} />
      {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
    </div>
  );
}
