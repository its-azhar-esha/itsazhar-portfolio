import { ProjectsPage } from "@/components/projects-page";
import { getPublicPageContent } from "@/lib/content";
import {
  DEFAULT_PROJECTS_CONTENT,
  type ProjectsPageContent,
} from "@/lib/content/defaults/projects";

export default async function ProjectsPageWrapper() {
  const content = await getPublicPageContent<ProjectsPageContent>(
    "projects",
    DEFAULT_PROJECTS_CONTENT,
  );
  return <ProjectsPage content={content} />;
}
