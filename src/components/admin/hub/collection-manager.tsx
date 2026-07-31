"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { Resource, ResourceCollection } from "@/types/hub";
import {
  createResourceCollectionAction,
  updateResourceCollectionAction,
  deleteResourceCollectionAction,
} from "@/lib/hub/actions";
import { createResourceCollectionSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { MediaField } from "@/components/media/media-field";

const inputClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function ResourcePicker({
  resources,
  value,
  onChange,
}: {
  resources: Resource[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border p-2">
      {resources.length === 0 && (
        <p className="text-muted-foreground px-2 py-4 text-center text-xs">
          No resources yet — create resources first.
        </p>
      )}
      {resources.map((resource) => {
        const checked = value.includes(resource.id);
        return (
          <button
            key={resource.id}
            type="button"
            onClick={() => onChange(toggleId(value, resource.id))}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              checked
                ? "border-primary/40 bg-primary/10 text-primary"
                : "hover:bg-accent/50 border-transparent"
            }`}
          >
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
              }`}
            >
              {checked && <Check className="h-3 w-3" />}
            </div>
            <span className="min-w-0 truncate font-medium">{resource.title}</span>
            <span className="text-muted-foreground ml-auto shrink-0">{resource.type}</span>
          </button>
        );
      })}
    </div>
  );
}

interface CollectionManagerProps {
  collections: ResourceCollection[];
  resources: Resource[];
  collectionItems: Record<string, string[]>;
}

export function CollectionManager({
  collections,
  resources,
  collectionItems,
}: CollectionManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const slugEdited = React.useRef(false);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [coverImage, setCoverImage] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingSlug, setEditingSlug] = React.useState("");
  const [editingDescription, setEditingDescription] = React.useState("");
  const [editingCoverImage, setEditingCoverImage] = React.useState("");
  const [editingFeatured, setEditingFeatured] = React.useState(false);
  const [editingSelectedIds, setEditingSelectedIds] = React.useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<ResourceCollection | null>(null);

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setCoverImage("");
    setFeatured(false);
    setSelectedIds([]);
    slugEdited.current = false;
  }

  async function handleCreate() {
    setError(null);
    const parsed = createResourceCollectionSchema.safeParse({
      name,
      slug,
      description,
      cover_image: coverImage || null,
      featured,
      display_order: 0,
      status: "published",
      resource_ids: selectedIds,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await createResourceCollectionAction(parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Collection created.");
    resetForm();
    router.refresh();
  }

  function startEdit(collection: ResourceCollection) {
    setEditingId(collection.id);
    setEditingName(collection.name);
    setEditingSlug(collection.slug);
    setEditingDescription(collection.description);
    setEditingCoverImage(collection.cover_image ?? "");
    setEditingFeatured(collection.featured);
    setEditingSelectedIds(collectionItems[collection.id] ?? []);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setError(null);
    const parsed = createResourceCollectionSchema.safeParse({
      name: editingName,
      slug: editingSlug,
      description: editingDescription,
      cover_image: editingCoverImage || null,
      featured: editingFeatured,
      display_order: 0,
      status: "published",
      resource_ids: editingSelectedIds,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = await updateResourceCollectionAction(editingId, parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Collection updated.");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    const result = await deleteResourceCollectionAction(deleteTarget.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Collection deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  const createForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="col-name">Name</Label>
        <Input
          id="col-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug || !slugEdited.current) setSlug(generateSlug(e.target.value));
          }}
          placeholder="Getting Started"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="col-slug">Slug</Label>
        <Input
          id="col-slug"
          value={slug}
          onChange={(e) => {
            slugEdited.current = true;
            setSlug(e.target.value);
          }}
          placeholder="getting-started"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="col-description">Description</Label>
        <textarea
          id="col-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
          placeholder="The essentials to start automating your business today."
        />
      </div>
      <div className="space-y-2">
        <Label>Cover image</Label>
        <MediaField
          value={coverImage}
          onChange={(value) => setCoverImage(value ?? "")}
          previewClassName="aspect-video w-full max-w-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Resources in this collection</Label>
        <ResourcePicker resources={resources} value={selectedIds} onChange={setSelectedIds} />
      </div>
      <div className="border-border/50 flex items-center justify-between rounded-lg border px-3 py-2.5">
        <span className="text-sm">Featured</span>
        <Switch checked={featured} onCheckedChange={setFeatured} />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <Button onClick={handleCreate} disabled={saving || !name.trim()} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create collection
      </Button>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">New Collection</h3>
          {createForm}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Collections ({collections.length})</h3>
          {collections.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No collections yet — create your first one.
            </p>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => {
                const itemCount = (collectionItems[collection.id] ?? []).length;
                return (
                  <div key={collection.id} className="border-border/60 rounded-lg border p-4">
                    {editingId === collection.id ? (
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
                          <Label>Description</Label>
                          <textarea
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            rows={2}
                            className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Cover image</Label>
                          <MediaField
                            value={editingCoverImage}
                            onChange={(value) => setEditingCoverImage(value ?? "")}
                            previewClassName="aspect-video w-full max-w-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Resources</Label>
                          <ResourcePicker
                            resources={resources}
                            value={editingSelectedIds}
                            onChange={setEditingSelectedIds}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="border-border/50 flex items-center gap-2 rounded-lg border px-3 py-2">
                            <span className="text-xs">Featured</span>
                            <Switch
                              checked={editingFeatured}
                              onCheckedChange={setEditingFeatured}
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
                          {collection.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{collection.name}</p>
                            {collection.featured && (
                              <span className="text-primary border-primary/30 bg-primary/10 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                            /hub/{collection.slug} · {itemCount} resources ·{" "}
                            {collection.description || "No description"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${collection.name}`}
                            onClick={() => startEdit(collection)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${collection.name}`}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => setDeleteTarget(collection)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete collection"
        description={`Delete "${deleteTarget?.name}"? This removes the grouping only; resources stay published.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
