"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Boxes,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { Resource, ResourceCategory } from "@/types/hub";
import {
  deleteResourceAction,
  draftResourceAction,
  publishResourceAction,
} from "@/lib/hub/actions";
import { RESOURCE_TYPE_LABELS } from "@/constants/hub";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface ResourceListProps {
  resources: Resource[];
  categories: ResourceCategory[];
  error: string | null;
}

export function ResourceList({ resources, categories, error }: ResourceListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [deleteTarget, setDeleteTarget] = React.useState<Resource | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const categoryName = (id: string | null) =>
    id ? (categories.find((c) => c.id === id)?.name ?? "—") : "—";

  const filtered = React.useMemo(
    () =>
      resources.filter((resource) => {
        if (statusFilter !== "all" && resource.status !== statusFilter) return false;
        if (typeFilter !== "all" && resource.type !== typeFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            resource.title.toLowerCase().includes(q) ||
            resource.slug.toLowerCase().includes(q) ||
            resource.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [resources, searchQuery, statusFilter, typeFilter],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteResourceAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    toast.success("Resource deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleStatus(resource: Resource) {
    const result =
      resource.status === "published"
        ? await draftResourceAction(resource.id)
        : await publishResourceAction(resource.id);
    if (!result.success) {
      setDeleteError(result.error);
    } else {
      toast.success(resource.status === "published" ? "Moved to draft." : "Published.");
    }
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load resources</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <Boxes className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No resources yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Add templates, agents, prompts and more to build your automation library.
        </p>
        <Link href="/admin/hub/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Resource
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
          >
            <option value="all">All types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link href="/admin/hub/new">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Resource
            </Button>
          </Link>
        </div>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-500/30 px-4 py-3 text-sm">
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No resources match your filters.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((resource) => (
            <motion.div key={resource.id} variants={staggerItem}>
              <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{resource.title}</h3>
                      <Badge variant="outline" className="text-primary text-[10px]">
                        {RESOURCE_TYPE_LABELS[resource.type]}
                      </Badge>
                      {resource.featured && (
                        <Badge variant="outline" className="text-primary text-[10px]">
                          Featured
                        </Badge>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                          resource.status === "published"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : resource.status === "draft"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                              : "border-muted-foreground/30 bg-muted/10 text-muted-foreground"
                        }`}
                      >
                        {resource.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {resource.summary}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      /hub/{resource.slug} · {categoryName(resource.category_id)} ·{" "}
                      {resource.downloads_count} downloads · v{resource.version ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={resource.status === "published" ? "Move to draft" : "Publish"}
                      onClick={() => handleToggleStatus(resource)}
                    >
                      {resource.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/hub/${resource.id}/edit`}>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${resource.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${resource.title}`}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteTarget(resource)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="text-muted-foreground text-center text-xs">
        {filtered.length} of {resources.length} resources
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete resource"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
