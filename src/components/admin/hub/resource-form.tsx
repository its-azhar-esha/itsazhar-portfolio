"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
} from "@/lib/hub/actions";
import { createResourceSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { renderMarkdown } from "@/lib/markdown";
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_STATUSES,
  ACCESS_LEVELS,
  PRICING_MODELS,
} from "@/constants/hub";
import type { Resource, ResourceCategory, ResourceFile } from "@/types/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { MediaField } from "@/components/media/media-field";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import type { ChangelogEntry } from "@/types/hub";

const selectClass =
  "border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none";
const textareaClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

interface FileField {
  id?: string;
  label: string;
  description: string;
  file_ref: string;
  file_size: number;
  file_type: string;
  display_order: number;
}

interface FormFields {
  type: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: string;
  tags: string[];
  cover_image: string;
  og_image: string;
  version: string;
  changelog: ChangelogEntry[];
  metadata: string;
  pricing_model: string;
  price: string;
  currency: string;
  purchase_url: string;
  access_level: string;
  featured: boolean;
  display_order: number;
  status: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  keywords: string[];
  files: FileField[];
}

function defaultFields(resource?: Resource, files: ResourceFile[] = []): FormFields {
  return {
    type: resource?.type ?? "workflow",
    title: resource?.title ?? "",
    slug: resource?.slug ?? "",
    summary: resource?.summary ?? "",
    content: resource?.content ?? "",
    category_id: resource?.category_id ?? "",
    tags: resource?.tags ?? [],
    cover_image: resource?.cover_image ?? "",
    og_image: resource?.og_image ?? "",
    version: resource?.version ?? "",
    changelog: resource?.changelog ?? [],
    metadata: resource?.metadata ? JSON.stringify(resource.metadata, null, 2) : "{}",
    pricing_model: resource?.pricing.model ?? "free",
    price: resource?.pricing.price ?? "",
    currency: resource?.pricing.currency ?? "",
    purchase_url: resource?.pricing.purchase_url ?? "",
    access_level: resource?.access_level ?? "free",
    featured: resource?.featured ?? false,
    display_order: resource?.display_order ?? 0,
    status: resource?.status ?? "draft",
    seo_title: resource?.seo_title ?? "",
    seo_description: resource?.seo_description ?? "",
    canonical_url: resource?.canonical_url ?? "",
    keywords: resource?.keywords ?? [],
    files: files.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      file_ref: f.file_ref,
      file_size: f.file_size,
      file_type: f.file_type,
      display_order: f.display_order,
    })),
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = fields.metadata.trim() ? JSON.parse(fields.metadata) : {};
  } catch {
    metadata = {};
  }
  return {
    type: fields.type,
    title: fields.title,
    slug: fields.slug,
    summary: fields.summary,
    content: fields.content,
    category_id: fields.category_id || null,
    tags: fields.tags,
    cover_image: fields.cover_image || null,
    og_image: fields.og_image || null,
    version: fields.version || null,
    changelog: fields.changelog,
    metadata,
    pricing: {
      model: fields.pricing_model,
      price: fields.price || null,
      currency: fields.currency || null,
      purchase_url: fields.purchase_url || null,
    },
    access_level: fields.access_level,
    featured: fields.featured,
    display_order: fields.display_order,
    status: fields.status,
    seo_title: fields.seo_title || null,
    seo_description: fields.seo_description || null,
    canonical_url: fields.canonical_url || null,
    keywords: fields.keywords,
    files: fields.files
      .filter((f) => f.label.trim() && f.file_ref.trim())
      .map((f) => ({
        id: f.id || null,
        label: f.label,
        description: f.description,
        file_ref: f.file_ref,
        file_size: f.file_size,
        file_type: f.file_type,
        display_order: f.display_order,
      })),
  };
}

interface ResourceFormProps {
  resource?: Resource;
  files?: ResourceFile[];
  categories: ResourceCategory[];
}

export function ResourceForm({ resource, files = [], categories }: ResourceFormProps) {
  const router = useRouter();
  const mode = resource ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(resource, files), [resource, files]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [showPreview, setShowPreview] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const slugManuallyEdited = React.useRef(false);
  const toast = useToast();

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
  );

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
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    handleChange({ slug: value });
  }

  function validate(): boolean {
    const result = createResourceSchema.safeParse(fieldsToJson(fields));
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      if (fields.metadata.trim() && !fieldErrors.metadata) {
        try {
          JSON.parse(fields.metadata);
        } catch {
          fieldErrors.metadata = "Metadata must be valid JSON.";
        }
      }
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors before saving.");
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = fieldsToJson(fields);
    const result = resource
      ? await updateResourceAction(resource.id, payload)
      : await createResourceAction(payload);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(mode === "create" ? "Resource created." : "Resource updated.");
    router.push("/admin/hub");
    router.refresh();
  }

  async function handleDelete() {
    if (!resource) return;
    setShowDeleteConfirm(false);
    const result = await deleteResourceAction(resource.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Resource deleted.");
    router.push("/admin/hub");
    router.refresh();
  }

  function updateChangelog(index: number, patch: Partial<ChangelogEntry>) {
    const next = fields.changelog.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
    handleChange({ changelog: next });
  }

  function updateFile(index: number, patch: Partial<FileField>) {
    const next = fields.files.map((file, i) =>
      i === index ? { ...file, ...patch, display_order: i } : file,
    );
    handleChange({ files: next });
  }

  function removeFile(index: number) {
    handleChange({ files: fields.files.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={fields.type}
                onChange={(e) => handleChange({ type: e.target.value })}
                className={selectClass}
              >
                {RESOURCE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {RESOURCE_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-destructive text-xs">{errors.type}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={fields.status}
                onChange={(e) => handleChange({ status: e.target.value })}
                className={selectClass}
              >
                {RESOURCE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={fields.category_id}
                onChange={(e) => handleChange({ category_id: e.target.value })}
                className={selectClass}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-destructive text-xs">{errors.category_id}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="Lead Follow-Up Automator"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={fields.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="lead-follow-up-automator"
              />
              {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <textarea
              id="summary"
              value={fields.summary}
              onChange={(e) => handleChange({ summary: e.target.value })}
              placeholder="One or two sentences shown on the hub listing and in search results."
              rows={2}
              className={textareaClass}
            />
            <p className="text-muted-foreground text-xs">
              {fields.summary.length} / 400 characters
            </p>
            {errors.summary && <p className="text-destructive text-xs">{errors.summary}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((prev) => !prev)}
                className="gap-1.5"
              >
                {showPreview ? (
                  <FileText className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            {showPreview ? (
              <div className="border-border bg-muted/20 rounded-lg border px-5 py-4">
                {fields.content.trim() ? (
                  renderMarkdown(fields.content)
                ) : (
                  <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
                )}
              </div>
            ) : (
              <textarea
                id="content"
                value={fields.content}
                onChange={(e) => handleChange({ content: e.target.value })}
                placeholder={
                  "Describe the resource in Markdown.\n\n## What's included\n\n- Step 1\n- Step 2"
                }
                rows={16}
                className={`${textareaClass} resize-y font-mono`}
              />
            )}
            {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                id="tags"
                value={fields.tags}
                onChange={(tags) => handleChange({ tags })}
                placeholder="Type a tag and press Enter"
              />
              {errors.tags && <p className="text-destructive text-xs">{errors.tags}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={fields.version}
                onChange={(e) => handleChange({ version: e.target.value })}
                placeholder="1.0.0"
              />
              {errors.version && <p className="text-destructive text-xs">{errors.version}</p>}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <MediaField
                value={fields.cover_image}
                onChange={(value) => handleChange({ cover_image: value ?? "" })}
                previewClassName="aspect-video w-full max-w-sm"
              />
              {errors.cover_image && (
                <p className="text-destructive text-xs">{errors.cover_image}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>OG Image</Label>
              <MediaField
                value={fields.og_image}
                onChange={(value) => handleChange({ og_image: value ?? "" })}
                previewClassName="aspect-video w-full max-w-sm"
              />
              {errors.og_image && <p className="text-destructive text-xs">{errors.og_image}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Access Level</Label>
              <select
                value={fields.access_level}
                onChange={(e) => handleChange({ access_level: e.target.value })}
                className={selectClass}
              >
                {ACCESS_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
              {errors.access_level && (
                <p className="text-destructive text-xs">{errors.access_level}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <select
                value={fields.pricing_model}
                onChange={(e) => handleChange({ pricing_model: e.target.value })}
                className={selectClass}
              >
                {PRICING_MODELS.map((value) => (
                  <option key={value} value={value}>
                    {value
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
              {errors.pricing_model && (
                <p className="text-destructive text-xs">{errors.pricing_model}</p>
              )}
            </div>
          </div>
          {fields.pricing_model !== "free" && (
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={fields.price}
                  onChange={(e) => handleChange({ price: e.target.value })}
                  placeholder="49"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={fields.currency}
                  onChange={(e) => handleChange({ currency: e.target.value })}
                  placeholder="USD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_url">Purchase URL</Label>
                <Input
                  id="purchase_url"
                  value={fields.purchase_url}
                  onChange={(e) => handleChange({ purchase_url: e.target.value })}
                  placeholder="https://gumroad.com/..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Files</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              handleChange({
                files: [
                  ...fields.files,
                  {
                    label: "",
                    description: "",
                    file_ref: "",
                    file_size: 0,
                    file_type: "application/octet-stream",
                    display_order: fields.files.length,
                  },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add file
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs">
            Files are the downloadable assets (workflow JSON, prompt packs, docs). Upload them in
            the Media library first, then reference them here.
          </p>
          {fields.files.length === 0 && (
            <p className="text-muted-foreground border-border/50 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
              No files yet — add a downloadable asset for this resource.
            </p>
          )}
          {fields.files.map((file, index) => (
            <div key={index} className="border-border/60 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold">File {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={file.label}
                    onChange={(e) => updateFile(index, { label: e.target.value })}
                    placeholder="workflow.json"
                  />
                </div>
                <div className="space-y-2">
                  <Label>File type</Label>
                  <Input
                    value={file.file_type}
                    onChange={(e) => updateFile(index, { file_type: e.target.value })}
                    placeholder="application/json"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>File (from Media library)</Label>
                <MediaField
                  value={file.file_ref}
                  onChange={(value) => updateFile(index, { file_ref: value ?? "" })}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={file.description}
                    onChange={(e) => updateFile(index, { description: e.target.value })}
                    placeholder="n8n import file"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (bytes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={Number.isFinite(file.file_size) ? String(file.file_size) : "0"}
                    onChange={(e) => updateFile(index, { file_size: Number(e.target.value) || 0 })}
                    placeholder="14820"
                  />
                </div>
              </div>
            </div>
          ))}
          {errors.files && <p className="text-destructive text-xs">{errors.files}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs">
            Changelog entries are shown on the resource page so visitors can see what changed.
          </p>
          {fields.changelog.length === 0 && (
            <p className="text-muted-foreground border-border/50 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
              No changelog entries yet.
            </p>
          )}
          {fields.changelog.map((entry, index) => (
            <div key={index} className="border-border/60 space-y-3 rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
                <div className="space-y-1.5">
                  <Label>Version</Label>
                  <Input
                    value={entry.version}
                    onChange={(e) => updateChangelog(index, { version: e.target.value })}
                    placeholder="1.1.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    value={entry.date}
                    onChange={(e) => updateChangelog(index, { date: e.target.value })}
                    placeholder="2026-08-01"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove changelog entry"
                    onClick={() =>
                      handleChange({ changelog: fields.changelog.filter((_, i) => i !== index) })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (one per line)</Label>
                <textarea
                  value={entry.notes.join("\n")}
                  onChange={(e) =>
                    updateChangelog(index, {
                      notes: e.target.value.split("\n").filter((n) => n.trim()),
                    })
                  }
                  rows={3}
                  placeholder={"Added retry logic.\nFixed credential handling."}
                  className={textareaClass}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              handleChange({
                changelog: [
                  ...fields.changelog,
                  { version: fields.version || "", date: "", notes: [] },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add version
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="display_order">Display order</Label>
              <Input
                id="display_order"
                type="number"
                value={String(fields.display_order)}
                onChange={(e) => handleChange({ display_order: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="border-border/50 flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Featured resource</p>
              <p className="text-muted-foreground text-xs">
                Featured resources are highlighted on the hub listing.
              </p>
            </div>
            <Switch
              checked={fields.featured}
              onCheckedChange={(v) => handleChange({ featured: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={fields.seo_title}
                onChange={(e) => handleChange({ seo_title: e.target.value })}
                placeholder="Title shown in search results (max 70)"
              />
              <p className="text-muted-foreground text-xs">
                {fields.seo_title.length} / 70 characters
              </p>
              {errors.seo_title && <p className="text-destructive text-xs">{errors.seo_title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Input
                id="seo_description"
                value={fields.seo_description}
                onChange={(e) => handleChange({ seo_description: e.target.value })}
                placeholder="Description shown in search results (max 160)"
              />
              <p className="text-muted-foreground text-xs">
                {fields.seo_description.length} / 160 characters
              </p>
              {errors.seo_description && (
                <p className="text-destructive text-xs">{errors.seo_description}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={fields.canonical_url}
              onChange={(e) => handleChange({ canonical_url: e.target.value })}
              placeholder="Leave blank to use the page URL"
            />
            {errors.canonical_url && (
              <p className="text-destructive text-xs">{errors.canonical_url}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Keywords</Label>
            <TagInput
              id="keywords"
              value={fields.keywords}
              onChange={(keywords) => handleChange({ keywords })}
              placeholder="Type a keyword and press Enter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <textarea
              id="metadata"
              value={fields.metadata}
              onChange={(e) => handleChange({ metadata: e.target.value })}
              rows={5}
              className={`${textareaClass} resize-y font-mono`}
              placeholder='{"runtime": "n8n", "format": "workflow.json"}'
            />
            {errors.metadata && <p className="text-destructive text-xs">{errors.metadata}</p>}
          </div>
        </CardContent>
      </Card>

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
            {mode === "create" ? "Create resource" : "Save changes"}
          </Button>
          {mode === "edit" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/hub")}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>
        {mode === "edit" && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete resource"
        description={`Are you sure you want to delete "${resource?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
