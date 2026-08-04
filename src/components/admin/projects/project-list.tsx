"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { DbProject } from "@/types/project";
import { staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { reorderProjectsAction } from "@/lib/projects/actions";
import { ProjectCard } from "./project-card";
import { ProjectActions } from "./project-actions";
import { ProjectEmptyState } from "./project-empty-state";

interface ProjectListProps {
  initialProjects: DbProject[];
  initialError: string | null;
}

export function ProjectList({ initialProjects, initialError }: ProjectListProps) {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = React.useState(initialProjects);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [savingOrder, setSavingOrder] = React.useState(false);
  const orderRef = React.useRef(initialProjects);

  const filtered = React.useMemo(
    () =>
      projects.filter((p) =>
        searchQuery
          ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [projects, searchQuery],
  );

  async function handleReorder(next: DbProject[]) {
    const prev = orderRef.current;
    const nextOrderedIds = next.map((p) => p.id);
    const prevOrderedIds = prev.map((p) => p.id);
    if (
      nextOrderedIds.length === prevOrderedIds.length &&
      nextOrderedIds.every((id, i) => id === prevOrderedIds[i])
    ) {
      return;
    }
    setProjects(next);
    orderRef.current = next;
    setSavingOrder(true);
    const result = await reorderProjectsAction(nextOrderedIds);
    setSavingOrder(false);
    if (!result.success) {
      toast.error(`Reorder failed: ${result.error}`);
      setProjects(prev);
      orderRef.current = prev;
      return;
    }
    router.refresh();
  }

  if (initialError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load projects</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{initialError}</p>
        <Button
          onClick={() => {
            router.refresh();
          }}
          variant="outline"
          className="mt-6 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return <ProjectEmptyState />;
  }

  return (
    <div className="space-y-6">
      <ProjectActions searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No projects match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <Reorder.Group
            axis="y"
            values={filtered}
            onReorder={(next) => void handleReorder(next as DbProject[])}
            className="space-y-3"
          >
            {filtered.map((project, index) => (
              <Reorder.Item
                key={project.id}
                value={project}
                dragListener={searchQuery.trim() === ""}
                className="cursor-grab active:cursor-grabbing"
              >
                <Link href={`/admin/projects/${project.id}/edit`} className="block">
                  <ProjectCard
                    project={project}
                    displayOrder={searchQuery.trim() ? project.order : index + 1}
                  />
                </Link>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </motion.div>
      )}
      <div className="flex items-center justify-center gap-2">
        {savingOrder && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving new order...
          </span>
        )}
        {!savingOrder && (
          <p className="text-muted-foreground text-xs">
            {filtered.length} of {projects.length} projects
          </p>
        )}
      </div>
      <p className="text-muted-foreground text-center text-[11px]">
        Drag a project card to a new position to change its display order. The public Projects page
        and homepage showcase update automatically.
      </p>
    </div>
  );
}
