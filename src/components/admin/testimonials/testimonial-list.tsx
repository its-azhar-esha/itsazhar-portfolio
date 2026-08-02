"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { DbTestimonial } from "@/types/testimonial";
import {
  deleteTestimonialAction,
  draftTestimonialAction,
  publishTestimonialAction,
} from "@/lib/testimonials/actions";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { formatDateBD } from "@/lib/format/dates";

interface TestimonialListProps {
  testimonials: DbTestimonial[];
  error: string | null;
}

export function TestimonialList({ testimonials, error }: TestimonialListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<DbTestimonial | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      testimonials.filter((t) =>
        searchQuery
          ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [testimonials, searchQuery],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteTestimonialAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    toast.success("Testimonial deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleStatus(testimonial: DbTestimonial) {
    const result =
      testimonial.status === "published"
        ? await draftTestimonialAction(testimonial.id)
        : await publishTestimonialAction(testimonial.id);
    if (!result.success) {
      setDeleteError(result.error);
    } else {
      toast.success(testimonial.status === "published" ? "Moved to draft." : "Published.");
    }
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load testimonials</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <MessageSquareQuote className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No testimonials yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Add your first testimonial. Published testimonials appear in the animated carousel on the
          homepage — don&apos;t forget to turn the section on in Settings.
        </p>
        <Link href="/admin/testimonials/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Testimonial
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/testimonials/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Testimonial
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
          <p className="text-muted-foreground text-sm">No testimonials match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((t) => (
            <motion.div key={t.id} variants={staggerItem}>
              <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <span className="text-sm font-semibold">
                      {t.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{t.name}</h3>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < t.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                          t.status === "published"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">“{t.quote}”</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {t.role}
                      {t.company ? ` · ${t.company}` : ""} · order {t.display_order}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-muted-foreground text-[10px]">Updated</p>
                    <p className="text-muted-foreground text-[10px]">
                      {formatDateBD(t.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.status === "published" ? "Move to draft" : "Publish"}
                      onClick={() => handleToggleStatus(t)}
                    >
                      {t.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/testimonials/${t.id}/edit`}>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete testimonial from ${t.name}`}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteTarget(t)}
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
        {filtered.length} of {testimonials.length} testimonials
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete testimonial"
        description={`Are you sure you want to delete the testimonial from "${deleteTarget?.name}"? This action cannot be undone.`}
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
