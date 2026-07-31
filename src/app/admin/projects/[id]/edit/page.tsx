import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import type { DbProject } from "@/types/project";
import { ProjectForm } from "@/components/admin/projects/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await getProject(id);
  if (!result.success) notFound();

  const project: DbProject = result.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Project</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update project details.</p>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
