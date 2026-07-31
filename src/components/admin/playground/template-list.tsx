"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GitBranch,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { WorkflowTemplate, WorkflowCategory } from "@/types/hub";
import { deleteWorkflowTemplateAction, updateWorkflowTemplateAction } from "@/lib/hub/actions";
import { DIFFICULTY_LABELS } from "@/constants/hub";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface TemplateListProps {
  templates: WorkflowTemplate[];
  categories: WorkflowCategory[];
  error: string | null;
}

export function TemplateList({ templates, categories, error }: TemplateListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowTemplate | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const categoryName = (id: string | null) =>
    id ? (categories.find((c) => c.id === id)?.name ?? "—") : "—";

  const filtered = React.useMemo(
    () =>
      templates.filter((template) => {
        if (statusFilter !== "all" && template.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            template.title.toLowerCase().includes(q) ||
            template.slug.toLowerCase().includes(q) ||
            template.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [templates, searchQuery, statusFilter],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    const result = await deleteWorkflowTemplateAction(deleteTarget.id);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    toast.success("Template deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleStatus(template: WorkflowTemplate) {
    setActionError(null);
    const result = await updateWorkflowTemplateAction(template.id, {
      status: template.status === "published" ? "draft" : "published",
    } as never);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    toast.success(template.status === "published" ? "Moved to draft." : "Published.");
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load templates</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <GitBranch className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No templates yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Build your first workflow template — it will appear in the public library.
        </p>
        <Link href="/admin/playground/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{actionError}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-9 w-56 pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <div className="ml-auto">
          <Link href="/admin/playground/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((template) => (
          <Card key={template.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{template.title}</p>
                  {template.featured && <Badge className="text-[10px]">Featured</Badge>}
                  <Badge variant="secondary" className="text-[10px]">
                    {DIFFICULTY_LABELS[template.difficulty]}
                  </Badge>
                  {template.status === "draft" && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {template.description || "—"} ·{" "}
                  <span className="text-muted-foreground/60">
                    {categoryName(template.category_id)} · {template.nodes.length} nodes ·{" "}
                    {template.views_count.toLocaleString()} views
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(template)}
                  title={template.status === "published" ? "Move to draft" : "Publish"}
                >
                  {template.status === "published" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/admin/playground/${template.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setDeleteTarget(template)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No templates match your filters.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete template?"
        description={`"${deleteTarget?.title ?? ""}" will be removed from the library permanently.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
