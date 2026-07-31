"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { DbProject } from "@/types/project";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./project-card";
import { ProjectActions } from "./project-actions";
import { ProjectEmptyState } from "./project-empty-state";

interface ProjectListProps {
  initialProjects: DbProject[];
  initialError: string | null;
}

export function ProjectList({ initialProjects, initialError }: ProjectListProps) {
  const router = useRouter();
  const projects = initialProjects;
  const error = initialError;
  const [searchQuery, setSearchQuery] = React.useState("");

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load projects</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
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
          {filtered.map((project) => (
            <motion.div key={project.id} variants={staggerItem}>
              <Link href={`/admin/projects/${project.id}/edit`}>
                <ProjectCard project={project} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
      <p className="text-muted-foreground text-center text-xs">
        {filtered.length} of {projects.length} projects
      </p>
    </div>
  );
}
