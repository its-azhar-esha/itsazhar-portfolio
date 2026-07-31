"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { WorkflowNodeType } from "@/types/hub";
import {
  createWorkflowNodeTypeAction,
  updateWorkflowNodeTypeAction,
  deleteWorkflowNodeTypeAction,
} from "@/lib/hub/actions";
import { createWorkflowNodeTypeSchema } from "@/lib/validation";
import { NODE_CATEGORY_LABELS, NODE_CATEGORIES } from "@/constants/hub";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

const inputClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

interface NodeTypeManagerProps {
  nodeTypes: WorkflowNodeType[];
  error?: string | null;
}

const emptyForm = {
  key: "",
  name: "",
  category: "data" as WorkflowNodeType["category"],
  icon: "circle",
  color: "#8b5cf6",
  description: "",
  config_schema: "",
  default_config: "",
  display_order: 0,
  status: "published" as WorkflowNodeType["status"],
};

function tryParseJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function NodeTypeManager({ nodeTypes, error: loadError }: NodeTypeManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState({ ...emptyForm });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(loadError ?? null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowNodeType | null>(null);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError(null);
  }

  function startEdit(nodeType: WorkflowNodeType) {
    setEditingId(nodeType.id);
    setForm({
      key: nodeType.key,
      name: nodeType.name,
      category: nodeType.category,
      icon: nodeType.icon,
      color: nodeType.color,
      description: nodeType.description,
      config_schema: JSON.stringify(nodeType.config_schema ?? {}, null, 2),
      default_config: JSON.stringify(nodeType.default_config ?? {}, null, 2),
      display_order: nodeType.display_order,
      status: nodeType.status,
    });
    setError(null);
  }

  async function handleSave() {
    setError(null);
    const config_schema = tryParseJson(form.config_schema || "{}");
    if (!config_schema) {
      setError("config_schema must be valid JSON.");
      return;
    }
    const default_config = tryParseJson(form.default_config || "{}");
    if (!default_config) {
      setError("default_config must be valid JSON.");
      return;
    }
    const payload = {
      key: form.key,
      name: form.name,
      category: form.category,
      icon: form.icon,
      color: form.color,
      description: form.description,
      config_schema,
      default_config,
      display_order: form.display_order,
      status: form.status,
    };
    const parsed = createWorkflowNodeTypeSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = editingId
      ? await updateWorkflowNodeTypeAction(editingId, parsed.data as never)
      : await createWorkflowNodeTypeAction(parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success(editingId ? "Node type updated." : "Node type created.");
    resetForm();
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteWorkflowNodeTypeAction(deleteTarget.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Node type deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">
            {editingId ? "Edit node type" : "New node type"}
          </h3>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Key (lowercase, used in workflow files)</Label>
              <Input
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="http_request"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="HTTP Request"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as WorkflowNodeType["category"],
                  }))
                }
                className={inputClass}
              >
                {NODE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {NODE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Icon name</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="zap"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className={`${inputClass} p-1`}
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Shown in the builder inspector."
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">config_schema (JSON)</Label>
              <textarea
                value={form.config_schema}
                onChange={(e) => setForm((f) => ({ ...f, config_schema: e.target.value }))}
                rows={5}
                placeholder='{"webhook_url":{"type":"string","label":"Webhook URL","required":true}}'
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 w-full resize-y rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">default_config (JSON)</Label>
              <textarea
                value={form.default_config}
                onChange={(e) => setForm((f) => ({ ...f, default_config: e.target.value }))}
                rows={5}
                placeholder='{"webhook_url":""}'
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 w-full resize-y rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end justify-between gap-4 pb-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Published</Label>
                <Switch
                  checked={form.status === "published"}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, status: v ? "published" : "draft" }))
                  }
                />
              </div>
              <div className="flex gap-2">
                {editingId && (
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingId ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <Card key={nodeType.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: nodeType.color }}
                  />
                  <p className="text-sm font-semibold">{nodeType.name}</p>
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                    {nodeType.key}
                  </code>
                  <span className="text-muted-foreground text-[10px] uppercase">
                    {NODE_CATEGORY_LABELS[nodeType.category]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {nodeType.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => startEdit(nodeType)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setDeleteTarget(nodeType)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {nodeTypes.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No node types yet — create one above.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete node type?"
        description={`"${deleteTarget?.name ?? ""}" will be removed. Workflows referencing this node key will keep working but show a generic icon.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
