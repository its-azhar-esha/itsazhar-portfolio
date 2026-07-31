import { ProjectForm } from "@/components/admin/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Project</h2>
        <p className="text-muted-foreground mt-1 text-sm">Create a new portfolio project.</p>
      </div>
      <ProjectForm />
    </div>
  );
}
