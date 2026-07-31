"use client";

import Link from "next/link";
import { ArrowRight, Calendar, GitBranch, User } from "lucide-react";
import type { SharedWorkflow, WorkflowNodeType } from "@/types/hub";
import { WorkflowBuilder } from "@/components/playground/workflow-builder";
import { Button } from "@/components/ui/button";

interface SharedWorkflowViewProps {
  workflow: SharedWorkflow;
  nodeTypes: WorkflowNodeType[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SharedWorkflowView({ workflow, nodeTypes }: SharedWorkflowViewProps) {
  return (
    <div className="space-y-5">
      <div className="border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h1 className="text-xl font-bold">{workflow.title}</h1>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {workflow.name && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {workflow.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Shared {formatDate(workflow.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {workflow.nodes.length} nodes
            </span>
          </div>
        </div>
        <Link
          href={`/playground/builder?template=${encodeURIComponent(
            JSON.stringify({
              nodes: workflow.nodes,
              edges: workflow.edges,
              title: workflow.title,
            }),
          )}`}
        >
          <Button size="sm" className="gap-1.5">
            Remix this workflow <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <WorkflowBuilder
        nodeTypes={nodeTypes}
        templates={[]}
        mode="readonly"
        initialNodes={workflow.nodes}
        initialEdges={workflow.edges}
        initialCanvas={workflow.canvas}
        initialTitle={workflow.title}
      />
    </div>
  );
}
