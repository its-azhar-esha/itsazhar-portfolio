"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectActionsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function ProjectActions({ searchQuery, onSearchChange }: ProjectActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Link href="/admin/projects/new">
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </Link>
    </div>
  );
}
