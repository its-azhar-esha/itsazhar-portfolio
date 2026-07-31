"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { resolveMediaValue, resolveMediaValues } from "@/lib/media/repository";
import {
  createResourceSchema,
  updateResourceSchema,
  createResourceCategorySchema,
  updateResourceCategorySchema,
  createResourceCollectionSchema,
  updateResourceCollectionSchema,
  createWorkflowNodeTypeSchema,
  updateWorkflowNodeTypeSchema,
  createWorkflowCategorySchema,
  updateWorkflowCategorySchema,
  createWorkflowTemplateSchema,
  updateWorkflowTemplateSchema,
  createSharedWorkflowSchema,
} from "@/lib/validation";
import type {
  CreateResourceInput,
  UpdateResourceInput,
  CreateResourceCategoryInput,
  CreateResourceCollectionInput,
  CreateWorkflowNodeTypeInput,
  CreateWorkflowCategoryInput,
  CreateWorkflowTemplateInput,
  Resource,
  ResourceCategory,
  ResourceCollection,
  ResourceFile,
  PublicResource,
  PublicResourceFile,
  PublicCollection,
  WorkflowNodeType,
  WorkflowCategory,
  WorkflowTemplate,
  PublicWorkflowTemplate,
  SharedWorkflow,
  CreateUserWorkflowInput,
} from "@/types/hub";
import {
  getResourceCategories,
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
  getResources,
  getResourceById,
  getResourceFiles,
  createResource,
  updateResource,
  deleteResource,
  getResourceCollections,
  createResourceCollection,
  updateResourceCollection,
  deleteResourceCollection,
  getCollectionItems,
  resolveDownloadUrl,
  getWorkflowNodeTypes,
  createWorkflowNodeType,
  updateWorkflowNodeType,
  deleteWorkflowNodeType,
  getWorkflowCategories,
  createWorkflowCategory,
  updateWorkflowCategory,
  deleteWorkflowCategory,
  getWorkflowTemplates,
  getWorkflowTemplateById,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  getSharedWorkflowByCode,
  createSharedWorkflow,
  getUserWorkflows,
  deleteUserWorkflow,
} from "./repository";
import {
  MOCK_RESOURCE_CATEGORIES,
  MOCK_RESOURCES,
  MOCK_RESOURCE_FILES,
  MOCK_COLLECTIONS,
  MOCK_NODE_TYPES,
  MOCK_WORKFLOW_CATEGORIES,
  MOCK_TEMPLATES,
} from "./mock-data";

/* ── Admin helpers ─────────────────────────────────────── */

function revalidateHubPaths(slug?: string): void {
  revalidatePath("/admin/hub");
  revalidatePath("/admin/hub/categories");
  revalidatePath("/admin/hub/collections");
  revalidatePath("/hub");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/hub/${slug}`);
}

function revalidatePlaygroundPaths(): void {
  revalidatePath("/admin/playground");
  revalidatePath("/playground");
  revalidatePath("/sitemap.xml");
}

async function requireUser(): Promise<Result<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Authentication required.");
  return ok(undefined);
}

function parseOrFail<T>(schema: z.ZodTypeAny, input: Record<string, unknown>): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join("; "));
  }
  return ok(parsed.data as T);
}

/* ── Automation Hub: resources ─────────────────────────── */

export async function createResourceAction(
  input: Record<string, unknown>,
): Promise<Result<Resource>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateResourceInput>(createResourceSchema, input);
    if (!parsed.success) return parsed;
    const result = await createResource(parsed.data);
    if (result.success) revalidateHubPaths(parsed.data.slug);
    return result;
  } catch (err) {
    logError("createResourceAction failed", { message: err instanceof Error ? err.message : err });
    return fail(err instanceof Error ? err.message : "Failed to create resource");
  }
}

export async function updateResourceAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<Resource>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<UpdateResourceInput>(updateResourceSchema, input);
    if (!parsed.success) return parsed;
    const result = await updateResource(id, parsed.data);
    if (result.success) revalidateHubPaths(parsed.data.slug);
    return result;
  } catch (err) {
    logError("updateResourceAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update resource");
  }
}

export async function deleteResourceAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteResource(id);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("deleteResourceAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete resource");
  }
}

export async function publishResourceAction(id: string): Promise<Result<Resource>> {
  return updateResourceAction(id, { status: "published" });
}

export async function draftResourceAction(id: string): Promise<Result<Resource>> {
  return updateResourceAction(id, { status: "draft" });
}

export async function getAdminResourcesAction(): Promise<Result<Resource[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getResources();
  } catch (err) {
    logError("getAdminResourcesAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list resources");
  }
}

export async function getAdminResourceAction(id: string): Promise<Result<Resource>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getResourceById(id);
  } catch (err) {
    logError("getAdminResourceAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to fetch resource");
  }
}

export async function getAdminResourceFilesAction(
  resourceId: string,
): Promise<Result<ResourceFile[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getResourceFiles(resourceId);
  } catch (err) {
    logError("getAdminResourceFilesAction failed", {
      resourceId,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to fetch resource files");
  }
}

export async function getAdminResourceCategoriesAction(): Promise<Result<ResourceCategory[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getResourceCategories();
  } catch (err) {
    logError("getAdminResourceCategoriesAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list categories");
  }
}

export async function createResourceCategoryAction(
  input: Record<string, unknown>,
): Promise<Result<ResourceCategory>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateResourceCategoryInput>(createResourceCategorySchema, input);
    if (!parsed.success) return parsed;
    const result = await createResourceCategory(parsed.data);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("createResourceCategoryAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create category");
  }
}

export async function updateResourceCategoryAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<ResourceCategory>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<Partial<CreateResourceCategoryInput>>(
      updateResourceCategorySchema,
      input,
    );
    if (!parsed.success) return parsed;
    const result = await updateResourceCategory(id, parsed.data);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("updateResourceCategoryAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update category");
  }
}

export async function deleteResourceCategoryAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteResourceCategory(id);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("deleteResourceCategoryAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete category");
  }
}

export async function getAdminCollectionsAction(): Promise<Result<ResourceCollection[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getResourceCollections();
  } catch (err) {
    logError("getAdminCollectionsAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list collections");
  }
}

export async function createResourceCollectionAction(
  input: Record<string, unknown>,
): Promise<Result<ResourceCollection>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateResourceCollectionInput & { resource_ids?: string[] }>(
      createResourceCollectionSchema,
      input,
    );
    if (!parsed.success) return parsed;
    const result = await createResourceCollection(parsed.data);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("createResourceCollectionAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create collection");
  }
}

export async function updateResourceCollectionAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<ResourceCollection>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<
      Partial<CreateResourceCollectionInput> & { resource_ids?: string[] }
    >(updateResourceCollectionSchema, input);
    if (!parsed.success) return parsed;
    const result = await updateResourceCollection(id, parsed.data);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("updateResourceCollectionAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update collection");
  }
}

export async function deleteResourceCollectionAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteResourceCollection(id);
    if (result.success) revalidateHubPaths();
    return result;
  } catch (err) {
    logError("deleteResourceCollectionAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete collection");
  }
}

/* ── Workflow Playground: admin ────────────────────────── */

export async function getAdminNodeTypesAction(): Promise<Result<WorkflowNodeType[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getWorkflowNodeTypes();
  } catch (err) {
    logError("getAdminNodeTypesAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list node types");
  }
}

export async function createWorkflowNodeTypeAction(
  input: Record<string, unknown>,
): Promise<Result<WorkflowNodeType>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateWorkflowNodeTypeInput>(createWorkflowNodeTypeSchema, input);
    if (!parsed.success) return parsed;
    const result = await createWorkflowNodeType(parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("createWorkflowNodeTypeAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create node type");
  }
}

export async function updateWorkflowNodeTypeAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<WorkflowNodeType>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<Partial<CreateWorkflowNodeTypeInput>>(
      updateWorkflowNodeTypeSchema,
      input,
    );
    if (!parsed.success) return parsed;
    const result = await updateWorkflowNodeType(id, parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("updateWorkflowNodeTypeAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update node type");
  }
}

export async function deleteWorkflowNodeTypeAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteWorkflowNodeType(id);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("deleteWorkflowNodeTypeAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete node type");
  }
}

export async function getAdminWorkflowCategoriesAction(): Promise<Result<WorkflowCategory[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getWorkflowCategories();
  } catch (err) {
    logError("getAdminWorkflowCategoriesAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list workflow categories");
  }
}

export async function createWorkflowCategoryAction(
  input: Record<string, unknown>,
): Promise<Result<WorkflowCategory>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateWorkflowCategoryInput>(createWorkflowCategorySchema, input);
    if (!parsed.success) return parsed;
    const result = await createWorkflowCategory(parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("createWorkflowCategoryAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create workflow category");
  }
}

export async function updateWorkflowCategoryAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<WorkflowCategory>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<Partial<CreateWorkflowCategoryInput>>(
      updateWorkflowCategorySchema,
      input,
    );
    if (!parsed.success) return parsed;
    const result = await updateWorkflowCategory(id, parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("updateWorkflowCategoryAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update workflow category");
  }
}

export async function deleteWorkflowCategoryAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteWorkflowCategory(id);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("deleteWorkflowCategoryAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete workflow category");
  }
}

export async function getAdminTemplatesAction(): Promise<Result<WorkflowTemplate[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getWorkflowTemplates();
  } catch (err) {
    logError("getAdminTemplatesAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list templates");
  }
}

export async function getAdminTemplateAction(id: string): Promise<Result<WorkflowTemplate>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    return getWorkflowTemplateById(id);
  } catch (err) {
    logError("getAdminTemplateAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to fetch template");
  }
}

export async function createWorkflowTemplateAction(
  input: Record<string, unknown>,
): Promise<Result<WorkflowTemplate>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<CreateWorkflowTemplateInput>(createWorkflowTemplateSchema, input);
    if (!parsed.success) return parsed;
    const result = await createWorkflowTemplate(parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("createWorkflowTemplateAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create template");
  }
}

export async function updateWorkflowTemplateAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<WorkflowTemplate>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const parsed = parseOrFail<Partial<CreateWorkflowTemplateInput>>(
      updateWorkflowTemplateSchema,
      input,
    );
    if (!parsed.success) return parsed;
    const result = await updateWorkflowTemplate(id, parsed.data);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("updateWorkflowTemplateAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update template");
  }
}

export async function deleteWorkflowTemplateAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteWorkflowTemplate(id);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("deleteWorkflowTemplateAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete template");
  }
}

export async function getAdminSharedWorkflowsAction(): Promise<Result<SharedWorkflow[]>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await getUserWorkflows();
    if (!result.success) return result;
    return ok(
      result.data.map((w) => ({
        id: w.id,
        share_code: w.share_code,
        title: w.title,
        name: w.name,
        nodes: w.nodes,
        edges: w.edges,
        canvas: w.canvas,
        created_at: w.created_at,
      })),
    );
  } catch (err) {
    logError("getAdminSharedWorkflowsAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to list shared workflows");
  }
}

export async function deleteSharedWorkflowAction(id: string): Promise<Result<void>> {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth;
    const result = await deleteUserWorkflow(id);
    if (result.success) revalidatePlaygroundPaths();
    return result;
  } catch (err) {
    logError("deleteSharedWorkflowAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete shared workflow");
  }
}

/* ── Public: Automation Hub ────────────────────────────── */

function resourceToPublic(
  resource: Resource,
  files: ResourceFile[],
  categories: ResourceCategory[],
): PublicResource {
  const category = resource.category_id
    ? (categories.find((c) => c.id === resource.category_id) ?? null)
    : null;
  return {
    id: resource.id,
    type: resource.type,
    title: resource.title,
    slug: resource.slug,
    summary: resource.summary,
    content: resource.content,
    category,
    tags: resource.tags,
    coverUrl: resource.cover_image,
    ogUrl: resource.og_image,
    version: resource.version,
    changelog: resource.changelog,
    metadata: resource.metadata,
    pricing: resource.pricing,
    access_level: resource.access_level,
    featured: resource.featured,
    display_order: resource.display_order,
    downloads_count: resource.downloads_count,
    seo_title: resource.seo_title,
    seo_description: resource.seo_description,
    canonical_url: resource.canonical_url,
    files: files.map((f): PublicResourceFile => ({
      id: f.id,
      label: f.label,
      description: f.description,
      file_size: f.file_size,
      file_type: f.file_type,
      download_count: f.download_count,
    })),
    created_at: resource.created_at,
    updated_at: resource.updated_at,
  };
}

async function withResolvedCovers<T extends { coverUrl: string | null }>(items: T[]): Promise<T[]> {
  const covers = await resolveMediaValues(items.map((i) => i.coverUrl));
  return items.map((item, i) => ({ ...item, coverUrl: covers[i] }));
}

export async function getPublicCategoriesAction(): Promise<ResourceCategory[]> {
  try {
    const result = await getResourceCategories();
    if (!result.success) return MOCK_RESOURCE_CATEGORIES.filter((c) => c.status === "published");
    return result.data.filter((c) => c.status === "published");
  } catch {
    return MOCK_RESOURCE_CATEGORIES.filter((c) => c.status === "published");
  }
}

export interface PublicResourceQuery {
  search?: string;
  type?: string;
  category?: string;
}

export async function getPublicResourcesAction(
  query: PublicResourceQuery = {},
): Promise<PublicResource[]> {
  try {
    const result = await getResources({
      search: query.search,
      type: query.type && query.type !== "all" ? (query.type as never) : "all",
      status: "published",
    });
    if (!result.success) return [];
    const categoriesResult = await getResourceCategories();
    const categories = categoriesResult.success ? categoriesResult.data : MOCK_RESOURCE_CATEGORIES;
    const resources = result.data
      .filter((r) => !query.category || r.category_id === query.category)
      .map((r) => resourceToPublic(r, [], categories));
    const covers = await resolveMediaValues(resources.map((r) => r.coverUrl));
    const ogs = await resolveMediaValues(resources.map((r) => r.ogUrl));
    return resources.map((r, i) => ({ ...r, coverUrl: covers[i], ogUrl: ogs[i] }));
  } catch {
    const categories = MOCK_RESOURCE_CATEGORIES;
    const resources = MOCK_RESOURCES.filter((r) => r.status === "published")
      .filter(
        (r) =>
          !query.search ||
          r.title.toLowerCase().includes(query.search.toLowerCase()) ||
          r.summary.toLowerCase().includes(query.search.toLowerCase()),
      )
      .filter((r) => !query.type || query.type === "all" || r.type === query.type)
      .filter((r) => !query.category || r.category_id === query.category)
      .map((r) =>
        resourceToPublic(
          r,
          MOCK_RESOURCE_FILES.filter((f) => f.resource_id === r.id),
          categories,
        ),
      );
    return resources;
  }
}

export async function getPublicResourceAction(slug: string): Promise<PublicResource | null> {
  try {
    const result = await getResources({ status: "published" });
    if (!result.success) return null;
    const resource = result.data.find((r) => r.slug === slug);
    if (!resource) return null;
    const filesResult = await getResourceFiles(resource.id);
    const categoriesResult = await getResourceCategories();
    const publicResource = resourceToPublic(
      resource,
      filesResult.success ? filesResult.data : [],
      categoriesResult.success ? categoriesResult.data : MOCK_RESOURCE_CATEGORIES,
    );
    return {
      ...publicResource,
      coverUrl: publicResource.coverUrl ? await resolveMediaValue(publicResource.coverUrl) : null,
      ogUrl: publicResource.ogUrl ? await resolveMediaValue(publicResource.ogUrl) : null,
    };
  } catch {
    const mock = MOCK_RESOURCES.find((r) => r.slug === slug && r.status === "published");
    if (!mock) return null;
    return resourceToPublic(
      mock,
      MOCK_RESOURCE_FILES.filter((f) => f.resource_id === mock.id),
      MOCK_RESOURCE_CATEGORIES,
    );
  }
}

export async function getPublicCollectionsAction(): Promise<PublicCollection[]> {
  try {
    const result = await getResourceCollections();
    if (!result.success) return [];
    const collections = result.data.filter((c) => c.status === "published");
    const resourcesResult = await getResources({ status: "published" });
    const categoriesResult = await getResourceCategories();
    const resources = resourcesResult.success ? resourcesResult.data : [];
    const categories = categoriesResult.success ? categoriesResult.data : MOCK_RESOURCE_CATEGORIES;
    const enriched: PublicCollection[] = [];
    for (const collection of collections) {
      const itemsResult = await getCollectionItems(collection.id);
      const ids = itemsResult.success ? itemsResult.data : [];
      const itemResources = resources
        .filter((r) => ids.includes(r.id))
        .map((r) => resourceToPublic(r, [], categories));
      enriched.push({ ...collection, coverUrl: collection.cover_image, items: itemResources });
    }
    return withResolvedCovers(enriched);
  } catch {
    const collections: PublicCollection[] = MOCK_COLLECTIONS.filter(
      (c) => c.status === "published",
    ).map((c) => ({
      ...c,
      coverUrl: c.cover_image,
      items: MOCK_RESOURCES.filter((r) => r.status === "published").map((r) =>
        resourceToPublic(
          r,
          MOCK_RESOURCE_FILES.filter((f) => f.resource_id === r.id),
          MOCK_RESOURCE_CATEGORIES,
        ),
      ),
    }));
    return collections;
  }
}

/** Public download: RPC resolves the file ref + bumps counters; redirect on failure. */
export async function getDownloadUrlAction(fileId: string): Promise<Result<string>> {
  const result = await resolveDownloadUrl(fileId);
  if (!result.success) {
    logError("getDownloadUrlAction failed", { fileId, error: result.error });
    return fail(result.error);
  }
  return ok(result.data);
}

/* ── Public: Workflow Playground ───────────────────────── */

export async function getPublicNodeTypesAction(): Promise<WorkflowNodeType[]> {
  try {
    const result = await getWorkflowNodeTypes();
    if (!result.success) return MOCK_NODE_TYPES.filter((n) => n.status === "published");
    return result.data.filter((n) => n.status === "published");
  } catch {
    return MOCK_NODE_TYPES.filter((n) => n.status === "published");
  }
}

export async function getPublicWorkflowCategoriesAction(): Promise<WorkflowCategory[]> {
  try {
    const result = await getWorkflowCategories();
    if (!result.success) return MOCK_WORKFLOW_CATEGORIES.filter((c) => c.status === "published");
    return result.data.filter((c) => c.status === "published");
  } catch {
    return MOCK_WORKFLOW_CATEGORIES.filter((c) => c.status === "published");
  }
}

function templateToPublic(
  template: WorkflowTemplate,
  categories: WorkflowCategory[],
): PublicWorkflowTemplate {
  const category = template.category_id
    ? (categories.find((c) => c.id === template.category_id) ?? null)
    : null;
  return {
    id: template.id,
    title: template.title,
    slug: template.slug,
    description: template.description,
    category,
    difficulty: template.difficulty,
    tags: template.tags,
    thumbnailUrl: template.thumbnail,
    nodes: template.nodes,
    edges: template.edges,
    canvas: template.canvas,
    walkthrough: template.walkthrough,
    featured: template.featured,
    display_order: template.display_order,
    views_count: template.views_count,
    seo_title: template.seo_title,
    seo_description: template.seo_description,
    keywords: template.keywords,
    created_at: template.created_at,
    updated_at: template.updated_at,
  };
}

export interface PublicTemplateQuery {
  search?: string;
  category?: string;
  difficulty?: string;
}

export async function getPublicTemplatesAction(
  query: PublicTemplateQuery = {},
): Promise<PublicWorkflowTemplate[]> {
  try {
    const result = await getWorkflowTemplates({
      search: query.search,
      categoryId: query.category,
      difficulty: query.difficulty,
      status: "published",
    });
    if (!result.success) return [];
    const categoriesResult = await getWorkflowCategories();
    const categories = categoriesResult.success ? categoriesResult.data : MOCK_WORKFLOW_CATEGORIES;
    const templates = result.data.map((t) => templateToPublic(t, categories));
    const thumbnails = await resolveMediaValues(templates.map((t) => t.thumbnailUrl));
    return templates.map((t, i) => ({ ...t, thumbnailUrl: thumbnails[i] }));
  } catch {
    const categories = MOCK_WORKFLOW_CATEGORIES;
    return MOCK_TEMPLATES.filter((t) => t.status === "published")
      .filter(
        (t) =>
          !query.search ||
          t.title.toLowerCase().includes(query.search.toLowerCase()) ||
          t.description.toLowerCase().includes(query.search.toLowerCase()),
      )
      .filter((t) => !query.category || t.category_id === query.category)
      .filter((t) => !query.difficulty || t.difficulty === query.difficulty)
      .map((t) => templateToPublic(t, categories));
  }
}

export async function getPublicTemplateAction(
  slug: string,
): Promise<PublicWorkflowTemplate | null> {
  try {
    const result = await getWorkflowTemplates({ status: "published" });
    if (!result.success) return null;
    const template = result.data.find((t) => t.slug === slug);
    if (!template) return null;
    const categoriesResult = await getWorkflowCategories();
    const publicTemplate = templateToPublic(
      template,
      categoriesResult.success ? categoriesResult.data : MOCK_WORKFLOW_CATEGORIES,
    );
    return {
      ...publicTemplate,
      thumbnailUrl: publicTemplate.thumbnailUrl
        ? await resolveMediaValue(publicTemplate.thumbnailUrl)
        : null,
    };
  } catch {
    const mock = MOCK_TEMPLATES.find((t) => t.slug === slug && t.status === "published");
    if (!mock) return null;
    return templateToPublic(mock, MOCK_WORKFLOW_CATEGORIES);
  }
}

export async function getSharedWorkflowAction(code: string): Promise<SharedWorkflow | null> {
  try {
    const result = await getSharedWorkflowByCode(code);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function saveSharedWorkflowAction(
  input: Record<string, unknown>,
): Promise<Result<SharedWorkflow>> {
  try {
    const parsed = parseOrFail<CreateUserWorkflowInput>(createSharedWorkflowSchema, input);
    if (!parsed.success) return parsed;
    const result = await createSharedWorkflow(parsed.data);
    if (!result.success) return fail(result.error);
    return ok({
      id: result.data.id,
      share_code: result.data.share_code,
      title: result.data.title,
      name: result.data.name,
      nodes: result.data.nodes,
      edges: result.data.edges,
      canvas: result.data.canvas,
      created_at: result.data.created_at,
    });
  } catch (err) {
    logError("saveSharedWorkflowAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to save workflow");
  }
}
