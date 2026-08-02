"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, GitBranch, RefreshCw, Trash2 } from "lucide-react";
import type { UserWorkflow } from "@/types/hub";
import { deleteSharedWorkflowAction } from "@/lib/hub/actions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { formatDateBD } from "@/lib/format/dates";

interface SharedWorkflowsListProps {
  workflows: UserWorkflow[];
  error: string | null;
}

function formatDate(iso: string) {
  return formatDateBD(iso);
}

export function SharedWorkflowsList({ workflows, error }: SharedWorkflowsListProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = React.useState<UserWorkflow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    const result = await deleteSharedWorkflowAction(deleteTarget.id);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    toast.success("Shared workflow deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load shared workflows</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <GitBranch className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No shared workflows yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Visitors&apos; saved and shared workflows will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{actionError}</p>
      )}
      <div className="space-y-2">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{workflow.title}</p>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {workflow.name || "Anonymous"} · {workflow.email ? `${workflow.email} · ` : ""}
                  {workflow.nodes.length} nodes · {formatDate(workflow.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link href={`/playground/share/${workflow.share_code}`} target="_blank">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setDeleteTarget(workflow)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete shared workflow?"
        description={`"${deleteTarget?.title ?? ""}" and its share link will be removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
