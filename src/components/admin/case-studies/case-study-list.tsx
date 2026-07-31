"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { DbCaseStudy } from "@/types/case-study";
import {
  deleteCaseStudyAction,
  draftCaseStudyAction,
  publishCaseStudyAction,
} from "@/lib/case-studies/actions";
import { CASE_STUDY_ICONS } from "@/constants/case-studies";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface CaseStudyListProps {
  caseStudies: DbCaseStudy[];
  error: string | null;
}

export function CaseStudyList({ caseStudies, error }: CaseStudyListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<DbCaseStudy | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      caseStudies.filter((cs) =>
        searchQuery
          ? cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cs.challenge.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cs.slug.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [caseStudies, searchQuery],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteCaseStudyAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    toast.success("Case study deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleStatus(caseStudy: DbCaseStudy) {
    const result =
      caseStudy.status === "published"
        ? await draftCaseStudyAction(caseStudy.id)
        : await publishCaseStudyAction(caseStudy.id);
    if (!result.success) {
      setDeleteError(result.error);
    } else {
      toast.success(caseStudy.status === "published" ? "Moved to draft." : "Published.");
    }
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load case studies</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (caseStudies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <Plus className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No case studies yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Add your first case study for the &quot;From manual to automated&quot; section.
        </p>
        <Link href="/admin/case-studies/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Case Study
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
            placeholder="Search case studies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/case-studies/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Case Study
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
          <p className="text-muted-foreground text-sm">No case studies match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((cs) => {
            const Icon = CASE_STUDY_ICONS[cs.icon] ?? CASE_STUDY_ICONS.fleet;
            return (
              <motion.div key={cs.id} variants={staggerItem}>
                <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{cs.title}</h3>
                        {cs.subtitle && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            {cs.subtitle}
                          </Badge>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                            cs.status === "published"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {cs.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {cs.challenge}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        /{cs.slug} · order {cs.display_order} · {cs.workflow.length} workflow steps
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-muted-foreground text-[10px]">Updated</p>
                      <p className="text-muted-foreground text-[10px]">
                        {new Date(cs.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={cs.status === "published" ? "Move to draft" : "Publish"}
                        onClick={() => handleToggleStatus(cs)}
                      >
                        {cs.status === "published" ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/admin/case-studies/${cs.id}/edit`}>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${cs.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${cs.title}`}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => setDeleteTarget(cs)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <p className="text-muted-foreground text-center text-xs">
        {filtered.length} of {caseStudies.length} case studies
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete case study"
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
