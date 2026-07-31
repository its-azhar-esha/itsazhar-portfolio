"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { WorkflowCategory } from "@/types/hub";
import {
  createWorkflowCategoryAction,
  updateWorkflowCategoryAction,
  deleteWorkflowCategoryAction,
} from "@/lib/hub/actions";
import { createWorkflowCategorySchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

const inputClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

interface WorkflowCategoryManagerProps {
  categories: WorkflowCategory[];
}

export function WorkflowCategoryManager({ categories }: WorkflowCategoryManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const slugEdited = React.useRef(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("box");
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [published, setPublished] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingSlug, setEditingSlug] = React.useState("");
  const [editingDescription, setEditingDescription] = React.useState("");
  const [editingIcon, setEditingIcon] = React.useState("box");
  const [editingDisplayOrder, setEditingDisplayOrder] = React.useState(0);
  const [editingPublished, setEditingPublished] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowCategory | null>(null);

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setIcon("box");
    setDisplayOrder(0);
    setPublished(true);
  }

  async function handleCreate() {
    setError(null);
    const parsed = createWorkflowCategorySchema.safeParse({
      name,
      slug,
      description,
      icon,
      display_order: displayOrder,
      status: published ? "published" : "draft",
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await createWorkflowCategoryAction(parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Category created.");
    resetForm();
    router.refresh();
  }

  function startEdit(category: WorkflowCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingSlug(category.slug);
    setEditingDescription(category.description);
    setEditingIcon(category.icon);
    setEditingDisplayOrder(category.display_order);
    setEditingPublished(category.status === "published");
    setError(null);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setError(null);
    const parsed = createWorkflowCategorySchema.safeParse({
      name: editingName,
      slug: editingSlug,
      description: editingDescription,
      icon: editingIcon,
      display_order: editingDisplayOrder,
      status: editingPublished ? "published" : "draft",
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await updateWorkflowCategoryAction(editingId, parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Category updated.");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    const result = await deleteWorkflowCategoryAction(deleteTarget.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Category deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">New category</h3>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugEdited.current) setSlug(generateSlug(e.target.value));
                }}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  slugEdited.current = true;
                }}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Icon name</Label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="box"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display order</Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Label className="text-xs">Published</Label>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>
              <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              {editingId === category.id ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slug</Label>
                    <Input
                      value={editingSlug}
                      onChange={(e) => setEditingSlug(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      rows={2}
                      className="border-border bg-background text-foreground focus:border-primary/40 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Icon</Label>
                      <Input
                        value={editingIcon}
                        onChange={(e) => setEditingIcon(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Order</Label>
                      <Input
                        type="number"
                        value={editingDisplayOrder}
                        onChange={(e) => setEditingDisplayOrder(Number(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <Switch checked={editingPublished} onCheckedChange={setEditingPublished} />
                    </div>
                  </div>
                  {error && (
                    <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate} disabled={saving} className="gap-1.5">
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{category.name}</p>
                      <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {category.slug}
                      </code>
                      {category.status === "draft" && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteTarget(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">No categories yet.</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category?"
        description={`"${deleteTarget?.name ?? ""}" will be removed. Templates in this category will appear uncategorized.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
