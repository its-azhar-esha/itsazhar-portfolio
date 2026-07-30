import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { DbProject } from "@/types/project";
import { ProjectForm } from "@/components/admin/projects/project-form";

function rowToDbProject(row: Database["public"]["Tables"]["projects"]["Row"]): DbProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: row.short_description,
    description: row.description,
    industry: (row.industry as string[]) ?? [],
    category: row.category,
    technologies: (row.technologies as string[]) ?? [],
    thumbnail: row.thumbnail,
    images: (row.images as string[]) ?? [],
    video_url: row.video_url,
    client: row.client,
    demo_url: row.demo_url,
    github_url: row.github_url,
    featured: row.featured,
    status: row.status as DbProject["status"],
    order: row.order,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    keywords: (row.keywords as string[]) ?? [],
    og_image: row.og_image,
    canonical_url: row.canonical_url,
    challenge: row.challenge ?? null,
    solution: row.solution ?? null,
    workflow: (row.workflow as string[]) ?? [],
    impact: row.impact ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try Supabase first, fall back to mock data
  const supabase = await createClient();
  let project: DbProject | null = null;

  if (supabase) {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (data && !error) {
      project = rowToDbProject(data);
    }
  }

  if (!project) {
    const { getProject } = await import("@/lib/projects");
    const result = await getProject(id);
    if (!result.success) notFound();
    project = result.data;
  }

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
