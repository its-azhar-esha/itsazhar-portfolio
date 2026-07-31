"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { SeoEntry } from "@/types/seo";
import { createSeoAction, updateSeoAction, deleteSeoAction } from "@/lib/seo/actions";
import { createSeoSchema } from "@/lib/validation";
import { SEO_ROBOTS } from "@/constants/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaField } from "@/components/media/media-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface FormFields {
  page_key: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  canonical_url: string;
  robots: string;
}

function defaultFields(entry?: SeoEntry): FormFields {
  return {
    page_key: entry?.page_key ?? "",
    title: entry?.title ?? "",
    description: entry?.description ?? "",
    keywords: entry?.keywords?.join(", ") ?? "",
    og_image: entry?.og_image ?? "",
    canonical_url: entry?.canonical_url ?? "",
    robots: entry?.robots ?? "index,follow",
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  return {
    page_key: fields.page_key,
    title: fields.title,
    description: fields.description || null,
    keywords: fields.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    og_image: fields.og_image || null,
    canonical_url: fields.canonical_url || null,
    robots: fields.robots,
  };
}

interface SeoFormProps {
  entry?: SeoEntry;
}

export function SeoForm({ entry }: SeoFormProps) {
  const router = useRouter();
  const mode = entry ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(entry), [entry]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => ({ ...prev, ...partial }));
    if (message) setMessage(null);
  }

  function validate(): boolean {
    const data = fieldsToJson(fields);
    const result = createSeoSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormFields | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      showMessage("error", "Please fix the validation errors before saving.");
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setMessage(null);
    try {
      if (mode === "create") {
        const result = await createSeoAction(fieldsToJson(fields));
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "SEO entry created successfully.");
        router.push("/admin/seo");
      } else {
        const result = await updateSeoAction(entry!.id, fieldsToJson(fields));
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "SEO entry saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    setMessage(null);
    try {
      const result = await deleteSeoAction(entry.id);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      router.push("/admin/seo");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/seo");
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
        <CardHeader className="border-border/40 flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {mode === "create" ? "New SEO Entry" : "Edit SEO Entry"}
            </CardTitle>
            {entry && (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                {entry.page_key}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="page_key">Page Key</Label>
              <Input
                id="page_key"
                value={fields.page_key}
                onChange={(e) => handleChange({ page_key: e.target.value })}
                placeholder="home, about, projects, contact"
                disabled={mode === "edit"}
              />
              <p className="text-muted-foreground text-xs">
                Lowercase letters, numbers, hyphens, underscores, and slashes.
              </p>
              {errors.page_key && <p className="text-destructive text-xs">{errors.page_key}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="robots">Robots</Label>
              <select
                id="robots"
                value={fields.robots}
                onChange={(e) => handleChange({ robots: e.target.value })}
                className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
              >
                {SEO_ROBOTS.map((value) => (
                  <option key={value} value={value}>
                    {value.replace(",", ", ")}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">Search engine indexing behavior.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">SEO Title</Label>
            <Input
              id="title"
              value={fields.title}
              onChange={(e) => handleChange({ title: e.target.value })}
              placeholder="Page title shown in search results"
            />
            <div className="flex justify-between">
              <p className="text-muted-foreground text-xs">Recommended: 50–70 characters</p>
              <p className="text-muted-foreground text-xs">{fields.title.length}/70</p>
            </div>
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Meta Description</Label>
            <textarea
              id="description"
              value={fields.description}
              onChange={(e) => handleChange({ description: e.target.value })}
              placeholder="Short summary shown under the title in search results"
              rows={3}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            <div className="flex justify-between">
              <p className="text-muted-foreground text-xs">Recommended: 150–160 characters</p>
              <p className="text-muted-foreground text-xs">{fields.description.length}/160</p>
            </div>
            {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={fields.keywords}
                onChange={(e) => handleChange({ keywords: e.target.value })}
                placeholder="AI, automation, workflow"
              />
              <p className="text-muted-foreground text-xs">Comma-separated keywords.</p>
              {errors.keywords && <p className="text-destructive text-xs">{errors.keywords}</p>}
            </div>
            <div className="space-y-2">
              <MediaField
                label="OpenGraph Image"
                description="Recommended: 1200×630px."
                value={fields.og_image}
                onChange={(value) => handleChange({ og_image: value ?? "" })}
                previewClassName="aspect-video w-full max-w-xs"
              />
              {errors.og_image && <p className="text-destructive text-xs">{errors.og_image}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={fields.canonical_url}
              onChange={(e) => handleChange({ canonical_url: e.target.value })}
              placeholder="https://azhar.dev/about"
            />
            <p className="text-muted-foreground text-xs">The preferred URL for this page.</p>
            {errors.canonical_url && (
              <p className="text-destructive text-xs">{errors.canonical_url}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={mode !== "edit" || saving}
        >
          Delete
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : mode === "create" ? "Create Entry" : "Save Changes"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete SEO entry"
        description={`Are you sure you want to delete "${entry?.page_key}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
