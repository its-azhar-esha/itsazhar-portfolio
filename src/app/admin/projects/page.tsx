import { getProjects } from "@/lib/projects";
import { ProjectList } from "@/components/admin/projects/project-list";

export default async function AdminProjectsPage() {
  const result = await getProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your portfolio projects.</p>
      </div>
      <ProjectList
        initialProjects={result.success ? result.data.items : []}
        initialError={result.success ? null : result.error}
      />
    </div>
  );
}
