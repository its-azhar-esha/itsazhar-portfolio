"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { ResourceCategory } from "@/types/hub";
import {
  createResourceCategoryAction,
  updateResourceCategoryAction,
  deleteResourceCategoryAction,
} from "@/lib/hub/actions";
import { createResourceCategorySchema } from "@/lib/validation";
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

interface CategoryManagerProps {
  categories: ResourceCategory[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const slugEdited = React.useRef(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("box");
  const [published, setPublished] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingSlug, setEditingSlug] = React.useState("");
  const [editingDescription, setEditingDescription] = React.useState("");
  const [editingIcon, setEditingIcon] = React.useState("box");
  const [editingPublished, setEditingPublished] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<ResourceCategory | null>(null);

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setIcon("box");
    setPublished(true);
  }

  async function handleCreate() {
    setError(null);
    const parsed = createResourceCategorySchema.safeParse({
      name,
      slug,
      description,
      icon,
      display_order: 0,
      status: published ? "published" : "draft",
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await createResourceCategoryAction(parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Category created.");
    resetForm();
    router.refresh();
  }

  function startEdit(category: ResourceCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingSlug(category.slug);
    setEditingDescription(category.description);
    setEditingIcon(category.icon);
    setEditingPublished(category.status === "published");
  }

  async function handleUpdate() {
    if (!editingId) return;
    setError(null);
    const parsed = createResourceCategorySchema.safeParse({
      name: editingName,
      slug: editingSlug,
      description: editingDescription,
      icon: editingIcon,
      display_order: 0,
      status: editingPublished ? "published" : "draft",
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await updateResourceCategoryAction(editingId, parsed.data as never);
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
    const result = await deleteResourceCategoryAction(deleteTarget.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Category deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">New Category</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || !slugEdited.current) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Templates"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => {
                  slugEdited.current = true;
                  setSlug(e.target.value);
                }}
                placeholder="templates"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon name</Label>
              <Input
                id="cat-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="box"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <textarea
                id="cat-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
                placeholder="Ready-to-use automation templates you can copy and adapt."
              />
            </div>
            <div className="border-border/50 flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm">Published</span>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="w-full gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Categories ({categories.length})</h3>
          {categories.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No categories yet — create your first one.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="border-border/60 rounded-lg border p-4">
                  {editingId === category.id ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Name</Label>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Slug</Label>
                          <Input
                            value={editingSlug}
                            onChange={(e) => setEditingSlug(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Icon</Label>
                        <Input
                          value={editingIcon}
                          onChange={(e) => setEditingIcon(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          rows={2}
                          className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="border-border/50 flex items-center gap-2 rounded-lg border px-3 py-2">
                          <span className="text-xs">Published</span>
                          <Switch
                            checked={editingPublished}
                            onCheckedChange={setEditingPublished}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdate}
                            disabled={saving}
                            className="gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        {category.icon.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{category.name}</p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                              category.status === "published"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {category.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                          /hub/{category.slug} · {category.description || "No description"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${category.name}`}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category"
        description={`Delete "${deleteTarget?.name}"? Resources in this category will keep their data but lose the category link.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
