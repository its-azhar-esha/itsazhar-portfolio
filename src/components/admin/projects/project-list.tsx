"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { DbProject } from "@/types/project";
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

  const searching = searchQuery.trim() !== "";

  const filtered = React.useMemo(
    () =>
      projects.filter((p) =>
        searching
          ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
    [projects, searchQuery, searching],
  );

  async function saveOrder(ordered: DbProject[]) {
    const orderedIds = ordered.map((p) => p.id);
    setSavingOrder(true);
    const result = await reorderProjectsAction(orderedIds);
    setSavingOrder(false);
    if (!result.success) {
      toast.error(`Reorder failed: ${result.error}`);
      return false;
    }
    router.refresh();
    return true;
  }

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
    const ok = await saveOrder(next);
    if (!ok) {
      setProjects(prev);
      orderRef.current = prev;
    }
  }

  /** Moves a project one position up/down in the full list (fallback to drag). */
  async function moveProject(id: string, direction: -1 | 1) {
    const index = projects.findIndex((p) => p.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= projects.length) return;
    const next = [...projects];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const prev = projects;
    setProjects(next);
    orderRef.current = next;
    const ok = await saveOrder(next);
    if (!ok) {
      setProjects(prev);
      orderRef.current = prev;
    }
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
        <div className="space-y-3">
          <Reorder.Group
            axis="y"
            values={filtered}
            onReorder={(next) => void handleReorder(next as DbProject[])}
            className="space-y-3"
          >
            {filtered.map((project, index) => (
              <ProjectReorderItem
                key={project.id}
                project={project}
                index={index}
                total={filtered.length}
                searching={searching}
                saving={savingOrder}
                onMove={moveProject}
              />
            ))}
          </Reorder.Group>
        </div>
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
        Drag a project by its handle (⋮⋮) to a new position, or use the arrows. The public Projects
        page and homepage showcase update automatically.
      </p>
    </div>
  );
}

interface ProjectReorderItemProps {
  project: DbProject;
  index: number;
  total: number;
  searching: boolean;
  saving: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
}

function ProjectReorderItem({
  project,
  index,
  total,
  searching,
  saving,
  onMove,
}: ProjectReorderItemProps) {
  const controls = useDragControls();

  const dragDisabled = searching || saving;

  return (
    <Reorder.Item value={project} dragListener={false} dragControls={controls} className="relative">
      <div className="flex items-stretch gap-2">
        <div
          className={`flex w-7 shrink-0 flex-col items-center gap-0.5 pt-3 transition-opacity ${
            dragDisabled ? "pointer-events-none opacity-30" : ""
          }`}
        >
          <button
            type="button"
            aria-label={`Drag ${project.title} to reorder`}
            title="Drag to reorder"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              controls.start(e);
            }}
            className="text-muted-foreground hover:text-foreground -my-0.5 cursor-grab touch-none rounded p-0.5 transition-colors active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              aria-label={`Move ${project.title} up`}
              title="Move up"
              disabled={index === 0}
              onClick={() => onMove(project.id, -1)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5 transition-colors disabled:opacity-25"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={`Move ${project.title} down`}
              title="Move down"
              disabled={index === total - 1}
              onClick={() => onMove(project.id, 1)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5 transition-colors disabled:opacity-25"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
        <Link
          href={`/admin/projects/${project.id}/edit`}
          draggable={false}
          className="block min-w-0 flex-1"
        >
          <ProjectCard project={project} displayOrder={index + 1} />
        </Link>
      </div>
    </Reorder.Item>
  );
}
