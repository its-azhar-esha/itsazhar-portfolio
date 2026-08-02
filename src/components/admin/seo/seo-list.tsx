"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { SeoEntry } from "@/types/seo";
import { deleteSeoAction } from "@/lib/seo/actions";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { formatDateBD } from "@/lib/format/dates";

interface SeoListProps {
  entries: SeoEntry[];
  error: string | null;
}

export function SeoList({ entries, error }: SeoListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<SeoEntry | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      entries.filter((e) =>
        searchQuery
          ? e.page_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [entries, searchQuery],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteSeoAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    setDeleteTarget(null);
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load SEO entries</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/seo/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-500/30 px-4 py-3 text-sm">
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No SEO entries found.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((entry) => (
            <motion.div key={entry.id} variants={staggerItem}>
              <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <span className="text-sm font-bold">
                      {entry.page_key.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{entry.page_key}</h3>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.robots}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{entry.title}</p>
                    {entry.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-muted-foreground text-[10px]">Updated</p>
                    <p className="text-muted-foreground text-[10px]">
                      {formatDateBD(entry.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/admin/seo/${entry.id}/edit`}>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${entry.page_key}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${entry.page_key}`}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteTarget(entry)}
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
        {filtered.length} of {entries.length} entries
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete SEO entry"
        description={`Are you sure you want to delete "${deleteTarget?.page_key}"? This action cannot be undone.`}
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
