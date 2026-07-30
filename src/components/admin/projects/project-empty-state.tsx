"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
        <FolderKanban className="text-primary h-8 w-8" />
      </div>
      <h3 className="mt-6 text-lg font-semibold">No projects yet</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Get started by adding your first portfolio project. Projects will appear here once created.
      </p>
      <Link href="/admin/projects/new">
        <Button className="mt-6">Add your first project</Button>
      </Link>
    </div>
  );
}
