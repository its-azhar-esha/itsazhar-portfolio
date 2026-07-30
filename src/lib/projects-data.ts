export type { Project, ProjectStatus } from "@/types/project";

import type { Project } from "@/types/project";

import {
  getPublicProjectsAction as _getProjects,
  getPublicProjectAction as _getProject,
  getPublicSlugsAction as _getSlugs,
  getPublicAdjacentAction as _getAdjacent,
  getPublicRelatedAction as _getRelated,
} from "@/lib/projects/actions";

export const getProjects = _getProjects;
export const getProject = _getProject;
export const getProjectSlugs = _getSlugs;
export const getAdjacentProjects = _getAdjacent;
export const getRelatedProjects = _getRelated;

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await _getProjects();
  return all
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
}
