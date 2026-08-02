"use client";

import type { DbProject } from "@/types/project";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateBD } from "@/lib/format/dates";

interface ProjectCardProps {
  project: DbProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    archived: "bg-muted/10 text-muted-foreground border-muted/20",
  };

  return (
    <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
      <CardContent className="flex items-start gap-4 p-4 sm:p-5">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <span className="text-sm font-bold">{project.title.charAt(0)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{project.title}</h3>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusColor[project.status] ?? "bg-muted/10 text-muted-foreground"}`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {project.short_description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {project.category}
            </Badge>
            {project.featured && (
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                Featured
              </Badge>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-muted-foreground text-[10px]">{formatDateBD(project.created_at)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
