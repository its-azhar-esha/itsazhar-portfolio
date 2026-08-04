/**
 * Admin AI tool registry.
 *
 * Every mutating capability of the Admin AI lives here as a ToolDefinition.
 * The planner LLM only sees the tool ids + param contracts (JSON-safe, no
 * server imports leak to prompts); previews are computed by loadCurrent /
 * computeProposed from LIVE data; apply() runs the existing server actions
 * (single source of truth — auth, Zod, audit, notifications, revalidation).
 */

import type { ToolDefinition } from "./types";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { getProjects } from "@/lib/projects";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  reorderProjectsAction,
} from "@/lib/projects/actions";
import { getServices } from "@/lib/services";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/lib/services/actions";
import { getBlogPosts } from "@/lib/blog/repository";
import {
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
} from "@/lib/blog/actions";
import { getAllSeo } from "@/lib/seo";
import { createSeoAction, updateSeoAction } from "@/lib/seo/actions";
import { getAdminHeroContent } from "@/lib/hero";
import { saveHeroContentAction } from "@/lib/hero/actions";
import { getAdminAboutContent } from "@/lib/about";
import { saveAboutContentAction } from "@/lib/about/actions";
import { getLeads } from "@/lib/leads/repository";
import { updateLeadStatusAction } from "@/lib/leads/actions";
import { getSettings } from "@/lib/settings/repository";
import { saveSiteSettingsAction } from "@/lib/settings/actions";
import { CLEANUP_CATEGORIES } from "@/lib/cleanup";
import { runCleanupScanAction, runCleanupAction } from "@/lib/cleanup/actions";
import { LEAD_STATUSES } from "@/types/lead";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : undefined;
}

function fmtArray(v: unknown): string {
  const arr = asStringArray(v);
  return arr.length ? arr.join(", ") : "(none)";
}

/** Renders changed fields as "key: old → new" pairs for previews. */
function diffLines(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
): { before: string[]; after: string[] } {
  const before: string[] = [];
  const after: string[] = [];
  const keys = new Set([...Object.keys(current), ...Object.keys(proposed)]);
  for (const key of keys) {
    const c = Array.isArray(current[key]) ? fmtArray(current[key]) : current[key];
    const p = Array.isArray(proposed[key]) ? fmtArray(proposed[key]) : proposed[key];
    const cStr = c === undefined || c === null || c === "" ? "(unset)" : String(c);
    const pStr = p === undefined || p === null || p === "" ? "(unset)" : String(p);
    if (cStr === pStr) continue;
    before.push(`${key}: ${cStr}`);
    after.push(`${key}: ${pStr}`);
  }
  if (before.length === 0) {
    before.push("(no changes)");
  }
  return { before, after };
}

async function findProjectByTitle(
  title: string,
): Promise<
  Result<{
    id: string;
    title: string;
    status: string;
    featured: boolean;
    category: string;
    short_description: string;
    industry: string[];
    order: number;
    technologies: string[];
  }>
> {
  const result = await getProjects({ page: 1, pageSize: 100 });
  if (!result.success) return result;
  const match = result.data.items.find((p) => p.title.toLowerCase() === title.trim().toLowerCase());
  if (!match) {
    return fail(
      `No project titled "${title}" was found. Check the exact title in the current state.`,
    );
  }
  return ok({
    id: match.id,
    title: match.title,
    status: match.status,
    featured: match.featured,
    category: match.category,
    short_description: match.short_description,
    industry: match.industry ?? [],
    order: match.order,
    technologies: match.technologies ?? [],
  });
}

async function findServiceByTitle(
  title: string,
): Promise<
  Result<{
    id: string;
    title: string;
    status: string;
    featured: boolean;
    short_description: string;
    icon: string;
  }>
> {
  const result = await getServices();
  if (!result.success) return result;
  const match = result.data.find((s) => s.title.toLowerCase() === title.trim().toLowerCase());
  if (!match) {
    return fail(
      `No service titled "${title}" was found. Check the exact title in the current state.`,
    );
  }
  return ok({
    id: match.id,
    title: match.title,
    status: match.status,
    featured: match.featured,
    short_description: match.short_description ?? "",
    icon: match.icon,
  });
}

async function findBlogPostByTitle(
  title: string,
): Promise<
  Result<{
    id: string;
    title: string;
    status: string;
    featured: boolean;
    excerpt: string;
    slug: string;
  }>
> {
  const result = await getBlogPosts({});
  if (!result.success) return result;
  const match = result.data.find((p) => p.title.toLowerCase() === title.trim().toLowerCase());
  if (!match) {
    return fail(
      `No blog post titled "${title}" was found. Check the exact title in the current state.`,
    );
  }
  return ok({
    id: match.id,
    title: match.title,
    status: match.status,
    featured: match.featured,
    excerpt: match.excerpt ?? "",
    slug: match.slug,
  });
}

async function findSeoByPageKey(
  pageKey: string,
): Promise<
  Result<{
    id: string;
    page_key: string;
    title: string;
    description: string | null;
    keywords: string[];
  }>
> {
  const result = await getAllSeo();
  if (!result.success) return result;
  const match = result.data.find((s) => s.page_key === pageKey.trim());
  if (!match) {
    return fail(`No SEO entry for page "${pageKey}" was found.`);
  }
  return ok({
    id: match.id,
    page_key: match.page_key,
    title: match.title,
    description: match.description,
    keywords: match.keywords ?? [],
  });
}

async function findLeadByEmail(
  email: string,
): Promise<Result<{ id: string; name: string; email: string; status: string }>> {
  const result = await getLeads({ page: 1, pageSize: 100 });
  if (!result.success) return result;
  const match = result.data.items.find((l) => l.email.toLowerCase() === email.trim().toLowerCase());
  if (!match) {
    return fail(`No lead with email "${email}" was found.`);
  }
  return ok({ id: match.id, name: match.name, email: match.email, status: match.status });
}

/* ─── tool definitions ────────────────────────────────────────────────── */

export const TOOLS: ToolDefinition[] = [
  /* Projects */
  {
    id: "projects.create",
    module: "Projects",
    label: "Create project",
    description:
      "Adds a new project to the portfolio. Provide title, a lowercase hyphenated slug, category and at least one industry. Status can be 'draft' or 'active'.",
    params: {
      title: { type: "string", description: "Project title (required)" },
      slug: { type: "string", description: "Lowercase hyphenated URL slug (required)" },
      short_description: { type: "string", description: "One-line summary (required)" },
      description: { type: "string", description: "Full description (optional)" },
      category: { type: "string", description: "Project category (required)" },
      industry: {
        type: "array",
        description: "One or more industries (required)",
        items: { type: "string", description: "Industry name" },
      },
      technologies: {
        type: "array",
        description: "Technologies used",
        items: { type: "string", description: "Technology" },
      },
      featured: { type: "boolean", description: "Show on homepage showcase" },
      status: {
        type: "string",
        enum: ["draft", "active", "archived"],
        description: "Publish state (default draft)",
      },
      challenge: { type: "string", description: "Business challenge (optional)" },
      solution: { type: "string", description: "Solution summary (optional)" },
      impact: { type: "string", description: "Measurable impact (optional)" },
      workflow: {
        type: "array",
        description: "Workflow step names",
        items: { type: "string", description: "Step" },
      },
      client: { type: "string", description: "Client name (optional)" },
      demo_url: { type: "string", description: "Live demo URL (optional)" },
      github_url: { type: "string", description: "GitHub URL (optional)" },
      seo_title: { type: "string", description: "SEO title, max 70 chars (optional)" },
      seo_description: { type: "string", description: "SEO description, max 160 chars (optional)" },
      keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
      key_features: {
        type: "array",
        description: "Key features",
        items: { type: "string", description: "Feature" },
      },
      future_scope: {
        type: "array",
        description: "Future scope items",
        items: { type: "string", description: "Item" },
      },
    },
    async loadCurrent() {
      return { summary: "(new project — nothing exists yet)" };
    },
    computeProposed: (params) => Promise.resolve({ ...params }),
    previewText(current, proposed) {
      const p = (proposed ?? {}) as Record<string, unknown>;
      return {
        before: ["(new project)"],
        after: [
          `title: ${asString(p.title) || "(missing)"}`,
          `slug: ${asString(p.slug) || "(missing)"}`,
          `status: ${asString(p.status) || "draft"}`,
          `category: ${asString(p.category) || "(missing)"}`,
          `industry: ${fmtArray(p.industry)}`,
        ],
      };
    },
    async apply(params) {
      const result = await createProjectAction(params);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Project "${result.data.title}" created.` });
    },
  },

  {
    id: "projects.update",
    module: "Projects",
    label: "Update project",
    description:
      "Edits an existing project. Identify it by its exact `title` from the current state, then list ONLY the fields to change (same names as projects.create).",
    params: {
      title: {
        type: "string",
        description: "Exact current title of the project to edit (required identifier)",
      },
      slug: { type: "string", description: "New lowercase hyphenated slug" },
      short_description: { type: "string", description: "One-line summary" },
      description: { type: "string", description: "Full description" },
      category: { type: "string", description: "Project category" },
      industry: {
        type: "array",
        description: "Industries",
        items: { type: "string", description: "Industry name" },
      },
      technologies: {
        type: "array",
        description: "Technologies",
        items: { type: "string", description: "Technology" },
      },
      featured: { type: "boolean", description: "Show on homepage showcase" },
      status: {
        type: "string",
        enum: ["draft", "active", "archived"],
        description: "Publish state",
      },
      challenge: { type: "string", description: "Business challenge" },
      solution: { type: "string", description: "Solution summary" },
      impact: { type: "string", description: "Measurable impact" },
      workflow: {
        type: "array",
        description: "Workflow step names",
        items: { type: "string", description: "Step" },
      },
      client: { type: "string", description: "Client name" },
      demo_url: { type: "string", description: "Live demo URL" },
      github_url: { type: "string", description: "GitHub URL" },
      seo_title: { type: "string", description: "SEO title, max 70 chars" },
      seo_description: { type: "string", description: "SEO description, max 160 chars" },
      keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
      key_features: {
        type: "array",
        description: "Key features",
        items: { type: "string", description: "Feature" },
      },
      future_scope: {
        type: "array",
        description: "Future scope items",
        items: { type: "string", description: "Item" },
      },
    },
    async loadCurrent(params) {
      const current = await findProjectByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    async computeProposed(params) {
      const current = await findProjectByTitle(asString(params.title));
      if (!current.success) return { error: current.error };
      const { id: _id, ...rest } = current.data;
      void _id;
      return { ...rest, ...params };
    },
    previewText(current, proposed) {
      const c = (current ?? {}) as Record<string, unknown>;
      const p = (proposed ?? {}) as Record<string, unknown>;
      return diffLines(c, p);
    },
    async apply(params) {
      const current = await findProjectByTitle(asString(params.title));
      if (!current.success) return current;
      const { title, ...patch } = params;
      if (title !== undefined) patch.title = title;
      const result = await updateProjectAction(current.data.id, patch);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Project "${result.data.title}" updated.` });
    },
  },

  {
    id: "projects.delete",
    module: "Projects",
    label: "Delete project",
    description:
      "Permanently removes a project. Identify it by its exact `title`. Irreversible — always show it in previews.",
    params: {
      title: { type: "string", description: "Exact title of the project to delete (required)" },
    },
    async loadCurrent(params) {
      const current = await findProjectByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    computeProposed: () => Promise.resolve(null),
    previewText(current) {
      const c = (current ?? {}) as Record<string, unknown>;
      return {
        before: [
          `title: ${asString(c.title) || "?"}`,
          `status: ${asString(c.status) || "?"}`,
          `category: ${asString(c.category) || "?"}`,
        ],
        after: ["(deleted permanently — cannot be undone)"],
      };
    },
    async apply(params) {
      const current = await findProjectByTitle(asString(params.title));
      if (!current.success) return current;
      const result = await deleteProjectAction(current.data.id);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Project "${current.data.title}" deleted.` });
    },
  },

  {
    id: "projects.reorder",
    module: "Projects",
    label: "Reorder projects",
    description:
      "Changes the display order of projects. `orderedTitles` must list the exact titles of EVERY project in the desired order (first = position 1).",
    params: {
      orderedTitles: {
        type: "array",
        description: "Exact titles of all projects in the desired order (required)",
        items: { type: "string", description: "Project title" },
      },
    },
    async loadCurrent() {
      const result = await getProjects({ page: 1, pageSize: 100, sort: "order_asc" });
      if (!result.success) return result;
      return { orderedTitles: result.data.items.map((p) => p.title) };
    },
    computeProposed: (params) =>
      Promise.resolve({ orderedTitles: asStringArray(params.orderedTitles) }),
    previewText(current, proposed) {
      const c = ((current ?? {}) as { orderedTitles?: unknown }).orderedTitles;
      const p = ((proposed ?? {}) as { orderedTitles?: unknown }).orderedTitles;
      const cList = asStringArray(c);
      const pList = asStringArray(p);
      return {
        before: cList.map((t, i) => `${i + 1}. ${t}`),
        after: pList.map((t, i) => `${i + 1}. ${t}`),
      };
    },
    async apply(params) {
      const titles = asStringArray(params.orderedTitles);
      if (titles.length === 0) return fail("orderedTitles must not be empty.");
      const result = await getProjects({ page: 1, pageSize: 100, sort: "order_asc" });
      if (!result.success) return result;
      const all = result.data.items;
      if (all.length !== titles.length) {
        return fail(
          `orderedTitles must include all ${all.length} projects (got ${titles.length}). Missing: ${all
            .filter((p) => !titles.some((t) => t.toLowerCase() === p.title.toLowerCase()))
            .map((p) => p.title)
            .join(", ")}.`,
        );
      }
      const ids: string[] = [];
      for (const title of titles) {
        const match = all.find((p) => p.title.toLowerCase() === title.toLowerCase());
        if (!match) {
          return fail(`Unknown project title "${title}" in reorder list.`);
        }
        ids.push(match.id);
      }
      const reorderResult = await reorderProjectsAction(ids);
      if (!reorderResult.success) return fail(reorderResult.error);
      return ok({ summary: `Projects reordered (${ids.length} positions saved).` });
    },
  },

  /* Services */
  {
    id: "services.create",
    module: "Services",
    label: "Create service",
    description:
      "Adds a new service. Provide title, lowercase hyphenated slug and a short description. Status can be 'draft' or 'active'.",
    params: {
      title: { type: "string", description: "Service title (required)" },
      slug: { type: "string", description: "Lowercase hyphenated URL slug (required)" },
      short_description: { type: "string", description: "Short description (required)" },
      content: { type: "string", description: "Full service content (optional)" },
      icon: { type: "string", description: "Icon name (optional)" },
      featured: { type: "boolean", description: "Show on homepage" },
      status: { type: "string", enum: ["draft", "active"], description: "Publish state" },
      highlights: {
        type: "array",
        description: "Key highlights",
        items: { type: "string", description: "Highlight" },
      },
      seo_title: { type: "string", description: "SEO title, max 70 chars" },
      seo_description: { type: "string", description: "SEO description, max 160 chars" },
      seo_keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
    },
    async loadCurrent() {
      return { summary: "(new service — nothing exists yet)" };
    },
    computeProposed: (params) => Promise.resolve({ ...params }),
    previewText(_current, proposed) {
      const p = (proposed ?? {}) as Record<string, unknown>;
      return {
        before: ["(new service)"],
        after: [
          `title: ${asString(p.title) || "(missing)"}`,
          `slug: ${asString(p.slug) || "(missing)"}`,
          `status: ${asString(p.status) || "draft"}`,
          `short_description: ${asString(p.short_description) || "(missing)"}`,
        ],
      };
    },
    async apply(params) {
      const result = await createServiceAction(params);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Service "${result.data.title}" created.` });
    },
  },

  {
    id: "services.update",
    module: "Services",
    label: "Update service",
    description:
      "Edits an existing service. Identify it by its exact `title` from the current state, then list ONLY the fields to change.",
    params: {
      title: {
        type: "string",
        description: "Exact current title of the service to edit (required identifier)",
      },
      slug: { type: "string", description: "New lowercase hyphenated slug" },
      short_description: { type: "string", description: "Short description" },
      content: { type: "string", description: "Full service content" },
      icon: { type: "string", description: "Icon name" },
      featured: { type: "boolean", description: "Show on homepage" },
      status: { type: "string", enum: ["draft", "active"], description: "Publish state" },
      highlights: {
        type: "array",
        description: "Key highlights",
        items: { type: "string", description: "Highlight" },
      },
      seo_title: { type: "string", description: "SEO title, max 70 chars" },
      seo_description: { type: "string", description: "SEO description, max 160 chars" },
      seo_keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
    },
    async loadCurrent(params) {
      const current = await findServiceByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    async computeProposed(params) {
      const current = await findServiceByTitle(asString(params.title));
      if (!current.success) return { error: current.error };
      const { id: _id, ...rest } = current.data;
      void _id;
      return { ...rest, ...params };
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      const current = await findServiceByTitle(asString(params.title));
      if (!current.success) return current;
      const result = await updateServiceAction(current.data.id, params);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Service "${result.data.title}" updated.` });
    },
  },

  {
    id: "services.delete",
    module: "Services",
    label: "Delete service",
    description: "Permanently removes a service. Identify it by its exact `title`. Irreversible.",
    params: {
      title: { type: "string", description: "Exact title of the service to delete (required)" },
    },
    async loadCurrent(params) {
      const current = await findServiceByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    computeProposed: () => Promise.resolve(null),
    previewText(current) {
      const c = (current ?? {}) as Record<string, unknown>;
      return {
        before: [`title: ${asString(c.title) || "?"}`, `status: ${asString(c.status) || "?"}`],
        after: ["(deleted permanently — cannot be undone)"],
      };
    },
    async apply(params) {
      const current = await findServiceByTitle(asString(params.title));
      if (!current.success) return current;
      const result = await deleteServiceAction(current.data.id);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Service "${current.data.title}" deleted.` });
    },
  },

  /* Blog */
  {
    id: "blog.create",
    module: "Blog",
    label: "Create blog post",
    description:
      "Adds a new blog post. Provide title, lowercase hyphenated slug and the full content (markdown). Status defaults to 'draft'.",
    params: {
      title: { type: "string", description: "Post title (required)" },
      slug: { type: "string", description: "Lowercase hyphenated URL slug (required)" },
      content: { type: "string", description: "Full markdown content (required)" },
      excerpt: { type: "string", description: "Short excerpt (optional)" },
      tags: { type: "array", description: "Tags", items: { type: "string", description: "Tag" } },
      author: { type: "string", description: "Author (default Azhar)" },
      status: { type: "string", enum: ["draft", "published"], description: "Publish state" },
      featured: { type: "boolean", description: "Feature the post" },
      seo_title: { type: "string", description: "SEO title, max 70 chars" },
      seo_description: { type: "string", description: "SEO description, max 160 chars" },
      keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
    },
    async loadCurrent() {
      return { summary: "(new post — nothing exists yet)" };
    },
    computeProposed: (params) => Promise.resolve({ ...params }),
    previewText(_current, proposed) {
      const p = (proposed ?? {}) as Record<string, unknown>;
      return {
        before: ["(new blog post)"],
        after: [
          `title: ${asString(p.title) || "(missing)"}`,
          `slug: ${asString(p.slug) || "(missing)"}`,
          `status: ${asString(p.status) || "draft"}`,
          `content: ${asString(p.content).slice(0, 120)}${asString(p.content).length > 120 ? "…" : ""}`,
        ],
      };
    },
    async apply(params) {
      const result = await createBlogPostAction(params);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Blog post "${result.data.title}" created.` });
    },
  },

  {
    id: "blog.update",
    module: "Blog",
    label: "Update blog post",
    description:
      "Edits an existing blog post. Identify it by its exact `title` from the current state, then list ONLY the fields to change.",
    params: {
      title: {
        type: "string",
        description: "Exact current title of the post to edit (required identifier)",
      },
      slug: { type: "string", description: "New lowercase hyphenated slug" },
      content: { type: "string", description: "Full markdown content" },
      excerpt: { type: "string", description: "Short excerpt" },
      tags: { type: "array", description: "Tags", items: { type: "string", description: "Tag" } },
      author: { type: "string", description: "Author" },
      status: { type: "string", enum: ["draft", "published"], description: "Publish state" },
      featured: { type: "boolean", description: "Feature the post" },
      seo_title: { type: "string", description: "SEO title, max 70 chars" },
      seo_description: { type: "string", description: "SEO description, max 160 chars" },
      keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
    },
    async loadCurrent(params) {
      const current = await findBlogPostByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    async computeProposed(params) {
      const current = await findBlogPostByTitle(asString(params.title));
      if (!current.success) return { error: current.error };
      const { id: _id, ...rest } = current.data;
      void _id;
      return { ...rest, ...params };
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      const current = await findBlogPostByTitle(asString(params.title));
      if (!current.success) return current;
      const { title, ...patch } = params;
      if (title !== undefined) patch.title = title;
      const result = await updateBlogPostAction(current.data.id, patch);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Blog post "${result.data.title}" updated.` });
    },
  },

  {
    id: "blog.delete",
    module: "Blog",
    label: "Delete blog post",
    description: "Permanently removes a blog post. Identify it by its exact `title`. Irreversible.",
    params: {
      title: { type: "string", description: "Exact title of the post to delete (required)" },
    },
    async loadCurrent(params) {
      const current = await findBlogPostByTitle(asString(params.title));
      return current.success ? current.data : { error: current.error };
    },
    computeProposed: () => Promise.resolve(null),
    previewText(current) {
      const c = (current ?? {}) as Record<string, unknown>;
      return {
        before: [`title: ${asString(c.title) || "?"}`, `status: ${asString(c.status) || "?"}`],
        after: ["(deleted permanently — cannot be undone)"],
      };
    },
    async apply(params) {
      const current = await findBlogPostByTitle(asString(params.title));
      if (!current.success) return current;
      const result = await deleteBlogPostAction(current.data.id);
      if (!result.success) return fail(result.error);
      return ok({ summary: `Blog post "${current.data.title}" deleted.` });
    },
  },

  /* SEO */
  {
    id: "seo.update",
    module: "SEO",
    label: "Update SEO metadata",
    description:
      "Updates the SEO metadata for one page. Identify it by `page_key` (from the current state: home, about, projects, services, blog, hub, playground, contact), then provide the new title/description/keywords.",
    params: {
      page_key: { type: "string", description: "Page key to update (required)" },
      title: { type: "string", description: "SEO title, max 70 chars" },
      description: { type: "string", description: "SEO description, max 160 chars" },
      keywords: {
        type: "array",
        description: "SEO keywords",
        items: { type: "string", description: "Keyword" },
      },
    },
    async loadCurrent(params) {
      const current = await findSeoByPageKey(asString(params.page_key));
      return current.success ? current.data : { error: current.error };
    },
    async computeProposed(params) {
      const current = await findSeoByPageKey(asString(params.page_key));
      if (!current.success) return { error: current.error };
      return { ...current.data, ...params };
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      const pageKey = asString(params.page_key);
      const current = await findSeoByPageKey(pageKey);
      if (current.success) {
        const { page_key: _pk, ...patch } = params;
        void _pk;
        const result = await updateSeoAction(current.data.id, patch);
        if (!result.success) return fail(result.error);
        return ok({ summary: `SEO metadata for "${result.data.page_key}" updated.` });
      }
      const result = await createSeoAction(params);
      if (!result.success) return fail(result.error);
      return ok({ summary: `SEO metadata for "${result.data.page_key}" created.` });
    },
  },

  /* Content: hero */
  {
    id: "content.hero",
    module: "Content",
    label: "Update hero section",
    description:
      "Edits the homepage hero section (headline, highlight word, subheadline, availability text, location). Provide ONLY the fields to change.",
    params: {
      headline: { type: "string", description: "Main headline" },
      highlight: { type: "string", description: "Highlighted word/phrase" },
      subheadline: { type: "string", description: "Sub-headline sentence" },
      availability: {
        type: "string",
        description: "Availability text (e.g. 'Available for new projects')",
      },
      location: { type: "string", description: "Location text" },
    },
    async loadCurrent() {
      try {
        const hero = await getAdminHeroContent();
        return {
          headline: hero.basic.headline,
          highlight: hero.basic.highlight,
          subheadline: hero.basic.subheadline,
          availability: hero.basic.availability,
          location: hero.basic.location,
        };
      } catch {
        return { error: "Could not load the hero section." };
      }
    },
    async computeProposed(params) {
      try {
        const hero = await getAdminHeroContent();
        return { ...hero.basic, ...params };
      } catch {
        return { error: "Could not load the hero section." };
      }
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      try {
        const hero = await getAdminHeroContent();
        const input = {
          ...hero,
          basic: { ...hero.basic, ...params },
        } as unknown as Record<string, unknown>;
        const result = await saveHeroContentAction(input);
        if (!result.success) return fail(result.error);
        return ok({ summary: "Hero section updated." });
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Failed to update hero section");
      }
    },
  },

  /* Content: about */
  {
    id: "content.about",
    module: "Content",
    label: "Update about section",
    description:
      "Edits the about page: bio paragraphs, headline, mission/vision statements, roles, and basic identity fields. Provide ONLY the fields to change.",
    params: {
      name: { type: "string", description: "Display name" },
      title: { type: "string", description: "Job title" },
      tagline: { type: "string", description: "Tagline" },
      headline: { type: "string", description: "Bio section headline" },
      paragraphs: {
        type: "array",
        description: "Full list of bio paragraphs (replaces existing)",
        items: { type: "string", description: "Paragraph" },
      },
      missionStatement: { type: "string", description: "Mission statement" },
      visionStatement: { type: "string", description: "Vision statement" },
      roles: {
        type: "array",
        description: "Role labels",
        items: { type: "string", description: "Role" },
      },
    },
    async loadCurrent() {
      try {
        const about = await getAdminAboutContent();
        return {
          name: about.basic?.name ?? "",
          title: about.basic?.title ?? "",
          tagline: about.basic?.tagline ?? "",
          headline: about.biography?.headline ?? "",
          paragraphs: about.biography?.paragraphs ?? [],
          missionStatement: about.biography?.missionStatement ?? "",
          visionStatement: about.biography?.visionStatement ?? "",
          roles: about.biography?.roles ?? [],
        };
      } catch {
        return { error: "Could not load the about section." };
      }
    },
    async computeProposed(params) {
      try {
        const about = await getAdminAboutContent();
        return {
          name: about.basic?.name ?? "",
          title: about.basic?.title ?? "",
          tagline: about.basic?.tagline ?? "",
          headline: about.biography?.headline ?? "",
          paragraphs: about.biography?.paragraphs ?? [],
          missionStatement: about.biography?.missionStatement ?? "",
          visionStatement: about.biography?.visionStatement ?? "",
          roles: about.biography?.roles ?? [],
          ...params,
        };
      } catch {
        return { error: "Could not load the about section." };
      }
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      try {
        const about = await getAdminAboutContent();
        const input = {
          ...about,
          basic: { ...about.basic, ...pick(params, ["name", "title", "tagline"]) },
          biography: {
            ...about.biography,
            ...pick(params, [
              "headline",
              "paragraphs",
              "missionStatement",
              "visionStatement",
              "roles",
            ]),
          },
        } as unknown as Record<string, unknown>;
        const result = await saveAboutContentAction(input);
        if (!result.success) return fail(result.error);
        return ok({ summary: "About section updated." });
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Failed to update about section");
      }
    },
  },

  /* Leads */
  {
    id: "leads.update",
    module: "Leads",
    label: "Update lead status",
    description:
      "Moves a lead to a new status. Identify the lead by its exact `email` from the current state.",
    params: {
      email: { type: "string", description: "Exact lead email (required identifier)" },
      status: { type: "string", enum: [...LEAD_STATUSES], description: "New status" },
    },
    async loadCurrent(params) {
      const current = await findLeadByEmail(asString(params.email));
      return current.success ? current.data : { error: current.error };
    },
    async computeProposed(params) {
      const current = await findLeadByEmail(asString(params.email));
      if (!current.success) return { error: current.error };
      return { ...current.data, ...params };
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      const current = await findLeadByEmail(asString(params.email));
      if (!current.success) return current;
      const result = await updateLeadStatusAction(current.data.id, {
        status: asString(params.status),
      });
      if (!result.success) return fail(result.error);
      return ok({
        summary: `Lead "${current.data.name}" (${current.data.email}) moved to ${result.data.status}.`,
      });
    },
  },

  /* Settings */
  {
    id: "settings.update",
    module: "Settings",
    label: "Update site settings",
    description:
      "Edits global site settings: branding (site_name, site_title, site_description, tagline, location), contact info (contact_email, contact_phone, booking_url), social links (social_github, social_linkedin, social_twitter, social_fiverr, social_instagram, social_youtube), footer text, section visibility toggles (show_hero, show_showcase, show_services, show_case_studies, show_about, show_testimonials, show_contact, show_blog, show_hub, show_playground), maintenance_mode, and analytics ids. Provide ONLY the fields to change.",
    params: {
      site_name: { type: "string", description: "Site name" },
      site_title: { type: "string", description: "Browser/tab title" },
      site_description: { type: "string", description: "Site description" },
      tagline: { type: "string", description: "Tagline" },
      location: { type: "string", description: "Location text" },
      contact_email: { type: "string", description: "Contact email" },
      contact_phone: { type: "string", description: "Contact phone" },
      booking_url: { type: "string", description: "Booking URL" },
      social_github: { type: "string", description: "GitHub profile URL" },
      social_linkedin: { type: "string", description: "LinkedIn profile URL" },
      social_twitter: { type: "string", description: "Twitter/X URL" },
      social_fiverr: { type: "string", description: "Fiverr URL" },
      social_instagram: { type: "string", description: "Instagram URL" },
      social_youtube: { type: "string", description: "YouTube URL" },
      footer_text: { type: "string", description: "Footer text" },
      maintenance_mode: { type: "boolean", description: "Put the site into maintenance mode" },
      show_hero: { type: "boolean", description: "Show hero section" },
      show_showcase: { type: "boolean", description: "Show project showcase" },
      show_services: { type: "boolean", description: "Show services section" },
      show_case_studies: { type: "boolean", description: "Show case studies" },
      show_about: { type: "boolean", description: "Show about section" },
      show_testimonials: { type: "boolean", description: "Show testimonials" },
      show_contact: { type: "boolean", description: "Show contact section" },
      show_blog: { type: "boolean", description: "Show blog nav/section" },
      show_hub: { type: "boolean", description: "Show hub nav/section" },
      show_playground: { type: "boolean", description: "Show playground" },
    },
    async loadCurrent() {
      const result = await getSettings();
      if (!result.success || !result.data) return { error: "Could not load site settings." };
      const s = result.data;
      return {
        site_name: s.site_name,
        site_title: s.site_title,
        site_description: s.site_description,
        tagline: s.tagline,
        location: s.location,
        contact_email: s.contact_email,
        contact_phone: s.contact_phone,
        booking_url: s.booking_url,
        social_github: s.social_github,
        social_linkedin: s.social_linkedin,
        social_twitter: s.social_twitter,
        social_fiverr: s.social_fiverr,
        social_instagram: s.social_instagram,
        social_youtube: s.social_youtube,
        footer_text: s.footer_text,
        maintenance_mode: s.maintenance_mode,
        show_hero: s.show_hero,
        show_showcase: s.show_showcase,
        show_services: s.show_services,
        show_case_studies: s.show_case_studies,
        show_about: s.show_about,
        show_testimonials: s.show_testimonials,
        show_contact: s.show_contact,
        show_blog: s.show_blog,
        show_hub: s.show_hub,
        show_playground: s.show_playground,
      };
    },
    async computeProposed(params) {
      const current = await getSettings();
      if (!current.success || !current.data) return { error: "Could not load site settings." };
      const s = current.data;
      return {
        site_name: s.site_name,
        site_title: s.site_title,
        site_description: s.site_description,
        tagline: s.tagline,
        location: s.location,
        contact_email: s.contact_email,
        contact_phone: s.contact_phone,
        booking_url: s.booking_url,
        social_github: s.social_github,
        social_linkedin: s.social_linkedin,
        social_twitter: s.social_twitter,
        social_fiverr: s.social_fiverr,
        social_instagram: s.social_instagram,
        social_youtube: s.social_youtube,
        footer_text: s.footer_text,
        maintenance_mode: s.maintenance_mode,
        show_hero: s.show_hero,
        show_showcase: s.show_showcase,
        show_services: s.show_services,
        show_case_studies: s.show_case_studies,
        show_about: s.show_about,
        show_testimonials: s.show_testimonials,
        show_contact: s.show_contact,
        show_blog: s.show_blog,
        show_hub: s.show_hub,
        show_playground: s.show_playground,
        ...params,
      };
    },
    previewText(current, proposed) {
      return diffLines(
        (current ?? {}) as Record<string, unknown>,
        (proposed ?? {}) as Record<string, unknown>,
      );
    },
    async apply(params) {
      const current = await getSettings();
      if (!current.success || !current.data) return fail("Could not load current site settings.");
      const input = { ...current.data, ...params } as unknown as Record<string, unknown>;
      const result = await saveSiteSettingsAction(input);
      if (!result.success) return fail(result.error);
      return ok({ summary: "Site settings updated." });
    },
  },

  /* Storage & cleanup */
  {
    id: "storage.cleanup",
    module: "Storage",
    label: "Run storage cleanup",
    description:
      "Runs a storage cleanup category. `categoryId` must be one of: unused-images, unused-files, duplicate-media, orphan-objects, empty-buckets, old-backup-files, audit-log, login-history, notification-deliveries, content-versions, analytics-events, backup-ledger, health-checks, broken-refs, stale-drafts, user-workflows. Optionally set `keepDays` to keep recent items. The scan preview shows what will be removed.",
    params: {
      categoryId: {
        type: "string",
        enum: CLEANUP_CATEGORIES.map((c) => c.id),
        description: "Cleanup category to run (required)",
      },
      keepDays: { type: "number", description: "Keep items newer than N days (optional)" },
    },
    async loadCurrent(params) {
      const category = CLEANUP_CATEGORIES.find((c) => c.id === asString(params.categoryId));
      if (!category) return { error: `Unknown cleanup category "${asString(params.categoryId)}".` };
      const scan = await runCleanupScanAction(category.id);
      if (!scan.success) return { error: scan.error };
      return {
        category: category.title,
        status: scan.data.status,
        total: scan.data.total,
        sizeBytes: scan.data.sizeBytes,
        message: scan.data.message,
        sample: scan.data.items.slice(0, 8).map((i) => i.name),
      };
    },
    computeProposed: (params) =>
      Promise.resolve({
        run: `cleanup "${asString(params.categoryId)}"`,
        keepDays: asNumber(params.keepDays) ?? null,
      }),
    previewText(current, proposed) {
      const c = (current ?? {}) as Record<string, unknown>;
      const p = (proposed ?? {}) as Record<string, unknown>;
      const before: string[] = [
        `category: ${asString(c.category) || asString(p.run) || "?"}`,
        `scan: ${asString(c.status) || "?"} (${Number(c.total ?? 0)} items, ${fmtBytes(Number(c.sizeBytes ?? 0))})`,
      ];
      if (Array.isArray(c.sample) && c.sample.length) {
        before.push(`sample: ${(c.sample as string[]).slice(0, 5).join(", ")}`);
      }
      const after: string[] = [
        `run cleanup and delete the scanned items`,
        Number(c.total ?? 0) > 0
          ? `(approximately ${Number(c.total)} items removed)`
          : "(nothing to clean)",
      ];
      void p;
      return { before, after };
    },
    async apply(params) {
      const categoryId = asString(params.categoryId);
      const category = CLEANUP_CATEGORIES.find((c) => c.id === categoryId);
      if (!category) return fail(`Unknown cleanup category "${categoryId}".`);
      const keepDays = asNumber(params.keepDays);
      const request =
        keepDays !== undefined ? { mode: "keep-days" as const, value: keepDays } : null;
      const result = await runCleanupAction(categoryId, request);
      if (!result.success) return fail(result.error);
      return ok({
        summary: `Cleanup "${category.title}" finished: ${result.data.deleted} items deleted (${fmtBytes(result.data.sizeBytes)}).`,
      });
    },
  },
];

/* ─── helpers exposed to the rest of the AI pipeline ──────────────────── */

function pick(params: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (params[key] !== undefined) out[key] = params[key];
  }
  return out;
}

function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const TOOL_MAP = new Map(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): ToolDefinition | undefined {
  return TOOL_MAP.get(id);
}

/** JSON-safe description of the registry for the planner prompt. */
export function describeTools(): Record<string, unknown> {
  return Object.fromEntries(
    TOOLS.map((t) => [
      t.id,
      {
        module: t.module,
        label: t.label,
        description: t.description,
        params: t.params,
      },
    ]),
  );
}
