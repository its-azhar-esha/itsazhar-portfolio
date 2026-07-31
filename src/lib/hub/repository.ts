import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";
import type {
  Resource,
  ResourceFile,
  ResourceCategory,
  ResourceCollection,
  WorkflowNodeType,
  WorkflowCategory,
  WorkflowTemplate,
  UserWorkflow,
  SharedWorkflow,
  CreateResourceInput,
  UpdateResourceInput,
  CreateResourceCategoryInput,
  UpdateResourceCategoryInput,
  CreateResourceCollectionInput,
  UpdateResourceCollectionInput,
  CreateWorkflowNodeTypeInput,
  UpdateWorkflowNodeTypeInput,
  CreateWorkflowCategoryInput,
  UpdateWorkflowCategoryInput,
  CreateWorkflowTemplateInput,
  UpdateWorkflowTemplateInput,
  CreateUserWorkflowInput,
} from "@/types/hub";
import type { ResourceStatus, ResourceType, SimpleStatus } from "@/constants/hub";

type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
type ResourceFileRow = Database["public"]["Tables"]["resource_files"]["Row"];
type ResourceCategoryRow = Database["public"]["Tables"]["resource_categories"]["Row"];
type ResourceCollectionRow = Database["public"]["Tables"]["resource_collections"]["Row"];
type NodeTypeRow = Database["public"]["Tables"]["workflow_node_types"]["Row"];
type WorkflowCategoryRow = Database["public"]["Tables"]["workflow_categories"]["Row"];
type TemplateRow = Database["public"]["Tables"]["workflow_templates"]["Row"];
type UserWorkflowRow = Database["public"]["Tables"]["user_workflows"]["Row"];

/** Admin form payload: resources carry their file list, collections carry item ids. */
export type ResourceWithFilesInput = CreateResourceInput & { files?: ResourceFile[] };
export type CollectionWithItemsInput = CreateResourceCollectionInput & { resource_ids?: string[] };

function rowToResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    type: row.type as Resource["type"],
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    category_id: row.category_id,
    tags: row.tags,
    cover_image: row.cover_image,
    og_image: row.og_image,
    version: row.version,
    changelog: (row.changelog as Resource["changelog"]) ?? [],
    metadata: (row.metadata as Resource["metadata"]) ?? {},
    pricing: (row.pricing as Resource["pricing"]) ?? { model: "free" },
    access_level: row.access_level as Resource["access_level"],
    featured: row.featured,
    display_order: row.display_order,
    status: row.status as Resource["status"],
    downloads_count: row.downloads_count,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    canonical_url: row.canonical_url,
    keywords: row.keywords,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToResourceFile(row: ResourceFileRow): ResourceFile {
  return {
    id: row.id,
    resource_id: row.resource_id,
    label: row.label,
    description: row.description,
    file_ref: row.file_ref,
    file_size: row.file_size,
    file_type: row.file_type,
    download_count: row.download_count,
    display_order: row.display_order,
    created_at: row.created_at,
  };
}

function rowToCategory(row: ResourceCategoryRow): ResourceCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    display_order: row.display_order,
    status: row.status as SimpleStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToCollection(row: ResourceCollectionRow): ResourceCollection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    cover_image: row.cover_image,
    featured: row.featured,
    display_order: row.display_order,
    status: row.status as SimpleStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToNodeType(row: NodeTypeRow): WorkflowNodeType {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    category: row.category as WorkflowNodeType["category"],
    icon: row.icon,
    color: row.color,
    description: row.description,
    config_schema: (row.config_schema as WorkflowNodeType["config_schema"]) ?? {},
    default_config: (row.default_config as WorkflowNodeType["default_config"]) ?? {},
    display_order: row.display_order,
    status: row.status as WorkflowNodeType["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToWorkflowCategory(row: WorkflowCategoryRow): WorkflowCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    display_order: row.display_order,
    status: row.status as SimpleStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToTemplate(row: TemplateRow): WorkflowTemplate {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category_id: row.category_id,
    difficulty: row.difficulty as WorkflowTemplate["difficulty"],
    tags: row.tags,
    thumbnail: row.thumbnail,
    nodes: (row.nodes as WorkflowTemplate["nodes"]) ?? [],
    edges: (row.edges as WorkflowTemplate["edges"]) ?? [],
    canvas: (row.canvas as WorkflowTemplate["canvas"]) ?? {},
    walkthrough: (row.walkthrough as WorkflowTemplate["walkthrough"]) ?? [],
    featured: row.featured,
    display_order: row.display_order,
    status: row.status as WorkflowTemplate["status"],
    views_count: row.views_count,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    keywords: row.keywords,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToUserWorkflow(row: UserWorkflowRow): UserWorkflow {
  return {
    id: row.id,
    share_code: row.share_code,
    title: row.title,
    name: row.name,
    email: row.email,
    nodes: (row.nodes as UserWorkflow["nodes"]) ?? [],
    edges: (row.edges as UserWorkflow["edges"]) ?? [],
    canvas: (row.canvas as UserWorkflow["canvas"]) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ── Automation Hub ─────────────────────────────────────── */

export async function getResourceCategories(): Promise<Result<ResourceCategory[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resource_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToCategory));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list resource categories");
  }
}

export async function createResourceCategory(
  input: CreateResourceCategoryInput,
): Promise<Result<ResourceCategory>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resource_categories")
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create category — no data returned.");
    return ok(rowToCategory(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create category");
  }
}

export async function updateResourceCategory(
  id: string,
  input: UpdateResourceCategoryInput,
): Promise<Result<ResourceCategory>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resource_categories")
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Category with id "${id}" not found.`);
    return ok(rowToCategory(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update category");
  }
}

export async function deleteResourceCategory(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("resource_categories").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete category");
  }
}

export interface ResourceQuery {
  search?: string;
  type?: ResourceType | "all";
  status?: ResourceStatus | "all";
  categoryId?: string;
}

export async function getResources(query: ResourceQuery = {}): Promise<Result<Resource[]>> {
  try {
    const supabase = await createClient();
    let builder = supabase.from("resources").select("*");
    const search = query.search?.trim();
    if (search) {
      builder = builder.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }
    if (query.type && query.type !== "all") builder = builder.eq("type", query.type);
    if (query.status && query.status !== "all") builder = builder.eq("status", query.status);
    if (query.categoryId) builder = builder.eq("category_id", query.categoryId);
    const { data, error } = await builder
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToResource));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list resources");
  }
}

export async function getResourceById(id: string): Promise<Result<Resource>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Resource with id "${id}" not found.`);
    return ok(rowToResource(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch resource");
  }
}

export async function getResourceFiles(resourceId: string): Promise<Result<ResourceFile[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resource_files")
      .select("*")
      .eq("resource_id", resourceId)
      .order("display_order", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToResourceFile));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch resource files");
  }
}

/** Replaces the full file list of a resource (admin form saves the whole set). */
async function replaceResourceFiles(
  resourceId: string,
  files: ResourceFile[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error: delError } = await supabase
      .from("resource_files")
      .delete()
      .eq("resource_id", resourceId);
    if (delError) return fail(delError.message);
    if (files.length === 0) return ok(undefined);
    const { error: insertError } = await supabase.from("resource_files").insert(
      files.map((f) => ({
        resource_id: resourceId,
        label: f.label,
        description: f.description,
        file_ref: f.file_ref,
        file_size: f.file_size,
        file_type: f.file_type,
        display_order: f.display_order,
      })) as never,
    );
    if (insertError) return fail(insertError.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to replace resource files");
  }
}

export async function createResource(input: ResourceWithFilesInput): Promise<Result<Resource>> {
  try {
    const supabase = await createClient();
    const { files, ...rest } = input;
    const { data, error } = await supabase
      .from("resources")
      .insert(rest as never)
      .select()
      .single();
    if (error) return fail(error.message);
    const row = data as ResourceRow | null;
    if (!row) return fail("Failed to create resource — no data returned.");
    if (files && files.length > 0) {
      const sync = await replaceResourceFiles(row.id, files);
      if (!sync.success) return sync;
    }
    return ok(rowToResource(row));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create resource");
  }
}

export async function updateResource(
  id: string,
  input: UpdateResourceInput & { files?: ResourceFile[] },
): Promise<Result<Resource>> {
  try {
    const supabase = await createClient();
    const { files, ...rest } = input;
    const { data, error } = await supabase
      .from("resources")
      .update(rest as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    const row = data as ResourceRow | null;
    if (!row) return fail(`Resource with id "${id}" not found.`);
    if (files) {
      const sync = await replaceResourceFiles(id, files);
      if (!sync.success) return sync;
    }
    return ok(rowToResource(row));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update resource");
  }
}

export async function deleteResource(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete resource");
  }
}

export async function getResourceCollections(): Promise<Result<ResourceCollection[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resource_collections")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToCollection));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list collections");
  }
}

export async function createResourceCollection(
  input: CollectionWithItemsInput,
): Promise<Result<ResourceCollection>> {
  try {
    const supabase = await createClient();
    const { resource_ids, ...rest } = input;
    const { data, error } = await supabase
      .from("resource_collections")
      .insert(rest as never)
      .select()
      .single();
    if (error) return fail(error.message);
    const row = data as ResourceCollectionRow | null;
    if (!row) return fail("Failed to create collection — no data returned.");
    if (resource_ids && resource_ids.length > 0) {
      const { error: itemsError } = await supabase.from("collection_items").insert(
        resource_ids.map((rid, i) => ({
          collection_id: row.id,
          resource_id: rid,
          position: i,
        })) as never,
      );
      if (itemsError) return fail(itemsError.message);
    }
    return ok(rowToCollection(row));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create collection");
  }
}

export async function updateResourceCollection(
  id: string,
  input: UpdateResourceCollectionInput & { resource_ids?: string[] },
): Promise<Result<ResourceCollection>> {
  try {
    const supabase = await createClient();
    const { resource_ids, ...rest } = input;
    const { data, error } = await supabase
      .from("resource_collections")
      .update(rest as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    const row = data as ResourceCollectionRow | null;
    if (!row) return fail(`Collection with id "${id}" not found.`);
    if (resource_ids) {
      const { error: delError } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", id);
      if (delError) return fail(delError.message);
      if (resource_ids.length > 0) {
        const { error: itemsError } = await supabase.from("collection_items").insert(
          resource_ids.map((rid, i) => ({
            collection_id: id,
            resource_id: rid,
            position: i,
          })) as never,
        );
        if (itemsError) return fail(itemsError.message);
      }
    }
    return ok(rowToCollection(row));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update collection");
  }
}

export async function deleteResourceCollection(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("resource_collections").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete collection");
  }
}

export async function getCollectionItems(collectionId: string): Promise<Result<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collection_items")
      .select("resource_id")
      .eq("collection_id", collectionId)
      .order("position", { ascending: true });
    if (error) return fail(error.message);
    return ok(((data ?? []) as { resource_id: string }[]).map((r) => r.resource_id));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list collection items");
  }
}

/** Resolves the storage URL for a downloadable file and bumps counters (RPC). */
export async function resolveDownloadUrl(fileId: string): Promise<Result<string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("increment_resource_download", {
      p_file_id: fileId,
    } as never);
    if (error) return fail(error.message);
    if (!data) return fail("Download not found.");
    return ok(String(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to resolve download");
  }
}

/* ── Workflow Playground ────────────────────────────────── */

export async function getWorkflowNodeTypes(): Promise<Result<WorkflowNodeType[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_node_types")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToNodeType));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list node types");
  }
}

export async function createWorkflowNodeType(
  input: CreateWorkflowNodeTypeInput,
): Promise<Result<WorkflowNodeType>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_node_types")
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create node type — no data returned.");
    return ok(rowToNodeType(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create node type");
  }
}

export async function updateWorkflowNodeType(
  id: string,
  input: UpdateWorkflowNodeTypeInput,
): Promise<Result<WorkflowNodeType>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_node_types")
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Node type with id "${id}" not found.`);
    return ok(rowToNodeType(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update node type");
  }
}

export async function deleteWorkflowNodeType(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("workflow_node_types").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete node type");
  }
}

export async function getWorkflowCategories(): Promise<Result<WorkflowCategory[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToWorkflowCategory));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list workflow categories");
  }
}

export async function createWorkflowCategory(
  input: CreateWorkflowCategoryInput,
): Promise<Result<WorkflowCategory>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_categories")
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create category — no data returned.");
    return ok(rowToWorkflowCategory(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create category");
  }
}

export async function updateWorkflowCategory(
  id: string,
  input: UpdateWorkflowCategoryInput,
): Promise<Result<WorkflowCategory>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_categories")
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Category with id "${id}" not found.`);
    return ok(rowToWorkflowCategory(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update category");
  }
}

export async function deleteWorkflowCategory(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("workflow_categories").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete category");
  }
}

export interface TemplateQuery {
  search?: string;
  categoryId?: string;
  difficulty?: string;
  status?: string;
}

export async function getWorkflowTemplates(
  query: TemplateQuery = {},
): Promise<Result<WorkflowTemplate[]>> {
  try {
    const supabase = await createClient();
    let builder = supabase.from("workflow_templates").select("*");
    const search = query.search?.trim();
    if (search) builder = builder.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (query.categoryId) builder = builder.eq("category_id", query.categoryId);
    if (query.difficulty) builder = builder.eq("difficulty", query.difficulty);
    if (query.status) builder = builder.eq("status", query.status);
    const { data, error } = await builder
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToTemplate));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list templates");
  }
}

export async function getWorkflowTemplateById(id: string): Promise<Result<WorkflowTemplate>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Template with id "${id}" not found.`);
    return ok(rowToTemplate(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch template");
  }
}

export async function createWorkflowTemplate(
  input: CreateWorkflowTemplateInput,
): Promise<Result<WorkflowTemplate>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_templates")
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create template — no data returned.");
    return ok(rowToTemplate(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create template");
  }
}

export async function updateWorkflowTemplate(
  id: string,
  input: UpdateWorkflowTemplateInput,
): Promise<Result<WorkflowTemplate>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_templates")
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Template with id "${id}" not found.`);
    return ok(rowToTemplate(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update template");
  }
}

export async function deleteWorkflowTemplate(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("workflow_templates").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete template");
  }
}

export async function incrementTemplateViews(templateId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_workflow_template_views", { p_template_id: templateId } as never);
  } catch {
    // Non-fatal counter.
  }
}

export async function getSharedWorkflowByCode(
  code: string,
): Promise<Result<SharedWorkflow | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_shared_workflow", { p_code: code } as never);
    if (error) return fail(error.message);
    if (!data) return ok(null);
    const row = data as unknown as SharedWorkflow;
    return ok(row);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load shared workflow");
  }
}

export async function createSharedWorkflow(
  input: CreateUserWorkflowInput,
): Promise<Result<UserWorkflow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_workflows")
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to save workflow — no data returned.");
    return ok(rowToUserWorkflow(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save workflow");
  }
}

export async function getUserWorkflows(): Promise<Result<UserWorkflow[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_workflows")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToUserWorkflow));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list shared workflows");
  }
}

export async function deleteUserWorkflow(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("user_workflows").delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete shared workflow");
  }
}
