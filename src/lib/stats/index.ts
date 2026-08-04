import { createClient } from "@/lib/supabase/server";
import { MOCK_PROJECTS } from "@/lib/projects/mock-data";
import { MOCK_SERVICES } from "@/lib/services/mock-data";

export interface LiveStats {
  /** Published (active) projects — "Automation Systems Built" / "Projects". */
  projects: number;
  /** Published services — "AI Automation Services". */
  services: number;
  /** Total documented workflow steps across published projects — "Workflows Created". */
  workflows: number;
  /** Unique technologies used across published projects. */
  technologies: number;
  /** Unique industries served across published projects. */
  industries: number;
  /** Number of published projects that are fully documented — "Documented Systems". */
  documentation: number;
}

interface ProjectSample {
  status: string;
  technologies: string[] | null;
  industry: string[] | null;
  challenge: string | null;
  solution: string | null;
  workflow: string[] | null;
  impact: string | null;
}

function deriveStats(rows: ProjectSample[], servicesCount: number): LiveStats {
  const published = rows.filter((r) => r.status === "active");
  const technologies = new Set<string>();
  const industries = new Set<string>();
  let documented = 0;
  let workflowSteps = 0;

  for (const p of published) {
    for (const t of p.technologies ?? []) {
      if (t.trim()) technologies.add(t.trim());
    }
    for (const i of p.industry ?? []) {
      if (i.trim()) industries.add(i.trim());
    }
    workflowSteps += (p.workflow ?? []).filter((s) => s.trim()).length;
    const fullyDocumented =
      Boolean(p.challenge?.trim()) &&
      Boolean(p.solution?.trim()) &&
      Boolean(p.impact?.trim()) &&
      (p.workflow ?? []).length > 0;
    if (fullyDocumented) documented += 1;
  }

  return {
    projects: published.length,
    services: servicesCount,
    workflows: workflowSteps,
    technologies: technologies.size,
    industries: industries.size,
    documentation: documented,
  };
}

/**
 * Live, render-time statistics computed from the CMS database.
 * Falls back to mock data when Supabase is unavailable (public-page rule).
 */
export async function getPublicStats(): Promise<LiveStats> {
  try {
    const supabase = await createClient();
    const [projectsRes, servicesRes] = await Promise.all([
      supabase
        .from("projects")
        .select("status, technologies, industry, challenge, solution, workflow, impact")
        .eq("status", "active"),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
    ]);
    if (projectsRes.error) throw new Error(projectsRes.error.message);
    return deriveStats(
      (projectsRes.data ?? []) as unknown as ProjectSample[],
      servicesRes.count ?? 0,
    );
  } catch {
    const published = MOCK_PROJECTS.filter((p) => p.status === "active");
    return deriveStats(published, MOCK_SERVICES.filter((s) => s.status === "published").length);
  }
}
