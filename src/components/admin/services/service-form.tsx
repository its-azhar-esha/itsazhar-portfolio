"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { DbService } from "@/types/service";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/lib/services/actions";
import { createServiceSchema } from "@/lib/validation";
import { SERVICE_ICON_NAMES, SERVICE_STATUSES } from "@/constants/services";
import { generateSlug } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface FormFields {
  slug: string;
  title: string;
  short_description: string;
  highlights: string;
  icon: string;
  featured: boolean;
  display_order: string;
  status: string;
  scheduledFor: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

function defaultFields(service?: DbService): FormFields {
  return {
    slug: service?.slug ?? "",
    title: service?.title ?? "",
    short_description: service?.short_description ?? "",
    highlights: Array.isArray(service?.content?.highlights)
      ? (service.content.highlights as string[]).join("\n")
      : "",
    icon: service?.icon ?? "bot",
    featured: service?.featured ?? false,
    display_order: String(service?.display_order ?? 0),
    status: service?.status ?? "published",
    scheduledFor: service?.scheduled_for ?? "",
    seo_title: service?.seo_title ?? "",
    seo_description: service?.seo_description ?? "",
    seo_keywords: service?.seo_keywords?.join(", ") ?? "",
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  return {
    slug: fields.slug,
    title: fields.title,
    short_description: fields.short_description,
    content: {
      highlights: fields.highlights
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    },
    icon: fields.icon,
    featured: fields.featured,
    display_order: Number(fields.display_order) || 0,
    status: fields.status,
    scheduled_for: toIso(fields.scheduledFor),
    seo_title: fields.seo_title || null,
    seo_description: fields.seo_description || null,
    seo_keywords: fields.seo_keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
}

function toLocalDateTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toIso(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface ServiceFormProps {
  service?: DbService;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const mode = service ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(service), [service]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const slugManuallyEdited = React.useRef(false);
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
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

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => {
      const next = { ...prev, ...partial };
      if ("title" in partial && !slugManuallyEdited.current && partial.title) {
        const generated = generateSlug(partial.title);
        if (generated !== next.slug) {
          next.slug = generated;
        }
      }
      return next;
    });
    if (message) setMessage(null);
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    handleChange({ slug: value });
  }

  function validate(): boolean {
    const data = fieldsToJson(fields);
    const result = createServiceSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of result.error.issues) {
        const rawKey = String(issue.path[0] ?? "");
        const key = (rawKey === "scheduled_for" ? "scheduledFor" : rawKey) as
          | keyof FormFields
          | undefined;
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
        const result = await createServiceAction(fieldsToJson(fields));
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "Service created successfully.");
        router.push("/admin/services");
      } else {
        const result = await updateServiceAction(service!.id, fieldsToJson(fields));
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "Service saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!service) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    setMessage(null);
    try {
      const result = await deleteServiceAction(service.id);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      router.push("/admin/services");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/services");
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
              {mode === "create" ? "New Service" : "Edit Service"}
            </CardTitle>
            {service && (
              <Badge
                variant="outline"
                className={
                  service.status === "published"
                    ? "border-emerald-500/30 text-emerald-500"
                    : "border-amber-500/30 text-amber-500"
                }
              >
                {service.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="AI Agents & Intelligent Assistants"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={fields.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="ai-agents-and-intelligent-assistants"
              />
              <p className="text-muted-foreground text-xs">
                Lowercase letters, numbers, and hyphens.
              </p>
              {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <textarea
              id="short_description"
              value={fields.short_description}
              onChange={(e) => handleChange({ short_description: e.target.value })}
              placeholder="One or two sentences describing this service."
              rows={3}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            <div className="flex justify-between">
              <p className="text-muted-foreground text-xs">Shown on cards and listings.</p>
              <p className="text-muted-foreground text-xs">{fields.short_description.length}/500</p>
            </div>
            {errors.short_description && (
              <p className="text-destructive text-xs">{errors.short_description}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <select
                id="icon"
                value={fields.icon}
                onChange={(e) => handleChange({ icon: e.target.value })}
                className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
              >
                {SERVICE_ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name.replace("_", " ")}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">Icon shown on cards.</p>
              {errors.icon && <p className="text-destructive text-xs">{errors.icon}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={fields.status}
                onChange={(e) => handleChange({ status: e.target.value })}
                className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
              >
                {SERVICE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                Published services appear on the public site.
              </p>
              {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Schedule publish (optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={fields.scheduledFor ? toLocalDateTime(fields.scheduledFor) : ""}
                onChange={(e) => handleChange({ scheduledFor: e.target.value })}
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to publish immediately. When set, the service appears publicly only
                after this time.
              </p>
              {errors.scheduledFor && (
                <p className="text-destructive text-xs">{errors.scheduledFor}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={fields.display_order}
                onChange={(e) => handleChange({ display_order: e.target.value })}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">Lower numbers appear first.</p>
              {errors.display_order && (
                <p className="text-destructive text-xs">{errors.display_order}</p>
              )}
            </div>
            <div className="flex h-9 items-end">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={fields.featured}
                  onChange={(e) => handleChange({ featured: e.target.checked })}
                  className="border-border bg-background text-primary focus:ring-primary/20 h-4 w-4 rounded border transition-colors focus:ring-1 focus:outline-none"
                />
                <span className="text-sm font-medium">Featured on homepage</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Highlights</Label>
            <textarea
              id="highlights"
              value={fields.highlights}
              onChange={(e) => handleChange({ highlights: e.target.value })}
              placeholder={"Custom AI agent development\nDecision-making workflows"}
              rows={4}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            <p className="text-muted-foreground text-xs">
              One highlight per line. Shown on the service detail page.
            </p>
          </div>

          <div className="border-border/40 border-t pt-6">
            <h3 className="mb-4 text-sm font-semibold">SEO</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={fields.seo_title}
                  onChange={(e) => handleChange({ seo_title: e.target.value })}
                  placeholder="Optional — defaults to service title"
                />
                <div className="flex justify-between">
                  <p className="text-muted-foreground text-xs">Recommended: 50–70 characters</p>
                  <p className="text-muted-foreground text-xs">{fields.seo_title.length}/70</p>
                </div>
                {errors.seo_title && <p className="text-destructive text-xs">{errors.seo_title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_keywords">SEO Keywords</Label>
                <Input
                  id="seo_keywords"
                  value={fields.seo_keywords}
                  onChange={(e) => handleChange({ seo_keywords: e.target.value })}
                  placeholder="AI, automation, n8n"
                />
                <p className="text-muted-foreground text-xs">Comma-separated keywords.</p>
                {errors.seo_keywords && (
                  <p className="text-destructive text-xs">{errors.seo_keywords}</p>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <textarea
                id="seo_description"
                value={fields.seo_description}
                onChange={(e) => handleChange({ seo_description: e.target.value })}
                placeholder="Optional — defaults to short description"
                rows={3}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
              />
              <div className="flex justify-between">
                <p className="text-muted-foreground text-xs">Recommended: 150–160 characters</p>
                <p className="text-muted-foreground text-xs">{fields.seo_description.length}/160</p>
              </div>
              {errors.seo_description && (
                <p className="text-destructive text-xs">{errors.seo_description}</p>
              )}
            </div>
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
          <Button onClick={handleSave} disabled={saving || (mode === "edit" && !hasChanges)}>
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create Service"
                : fields.status === "published"
                  ? "Save Changes"
                  : "Save Draft"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete service"
        description={`Are you sure you want to delete "${service?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
