import type {
  ResourceType,
  ResourceStatus,
  SimpleStatus,
  AccessLevel,
  PricingModel,
  NodeCategory,
  Difficulty,
  WorkflowStatus,
} from "@/constants/hub";

/* ── Automation Hub ─────────────────────────────────────── */

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export interface ResourcePricing {
  model: PricingModel;
  price?: string;
  currency?: string;
  purchase_url?: string | null;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  status: SimpleStatus;
  created_at: string;
  updated_at: string;
}

export type CreateResourceCategoryInput = Omit<
  ResourceCategory,
  "id" | "created_at" | "updated_at"
>;
export type UpdateResourceCategoryInput = Partial<CreateResourceCategoryInput>;

export interface ResourceFile {
  id: string;
  resource_id: string;
  label: string;
  description: string;
  file_ref: string;
  file_size: number;
  file_type: string;
  download_count: number;
  display_order: number;
  created_at: string;
}

export type CreateResourceFileInput = Omit<ResourceFile, "id" | "created_at">;

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: string | null;
  tags: string[];
  cover_image: string | null;
  og_image: string | null;
  version: string | null;
  changelog: ChangelogEntry[];
  metadata: Record<string, unknown>;
  pricing: ResourcePricing;
  access_level: AccessLevel;
  featured: boolean;
  display_order: number;
  status: ResourceStatus;
  downloads_count: number;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export type CreateResourceInput = Omit<Resource, "id" | "created_at" | "updated_at">;
export type UpdateResourceInput = Partial<CreateResourceInput>;

/** Public-facing resource: media resolved, category + files joined. */
export interface PublicResource {
  id: string;
  type: ResourceType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: ResourceCategory | null;
  tags: string[];
  coverUrl: string | null;
  ogUrl: string | null;
  version: string | null;
  changelog: ChangelogEntry[];
  metadata: Record<string, unknown>;
  pricing: ResourcePricing;
  access_level: AccessLevel;
  featured: boolean;
  display_order: number;
  downloads_count: number;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  files: PublicResourceFile[];
  created_at: string;
  updated_at: string;
}

export interface PublicResourceFile {
  id: string;
  label: string;
  description: string;
  file_size: number;
  file_type: string;
  download_count: number;
}

export interface ResourceCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string | null;
  featured: boolean;
  display_order: number;
  status: SimpleStatus;
  created_at: string;
  updated_at: string;
}

export type CreateResourceCollectionInput = Omit<
  ResourceCollection,
  "id" | "created_at" | "updated_at"
>;
export type UpdateResourceCollectionInput = Partial<CreateResourceCollectionInput>;

export interface PublicCollection extends ResourceCollection {
  coverUrl: string | null;
  items: PublicResource[];
}

/* ── Workflow Playground ────────────────────────────────── */

export interface WorkflowNodeType {
  id: string;
  key: string;
  name: string;
  category: NodeCategory;
  icon: string;
  color: string;
  description: string;
  config_schema: Record<string, unknown>;
  default_config: Record<string, unknown>;
  display_order: number;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
}

export type CreateWorkflowNodeTypeInput = Omit<
  WorkflowNodeType,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWorkflowNodeTypeInput = Partial<CreateWorkflowNodeTypeInput>;

export interface WorkflowCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  status: SimpleStatus;
  created_at: string;
  updated_at: string;
}

export type CreateWorkflowCategoryInput = Omit<
  WorkflowCategory,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWorkflowCategoryInput = Partial<CreateWorkflowCategoryInput>;

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  label?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WalkthroughStep {
  title: string;
  description: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string | null;
  difficulty: Difficulty;
  tags: string[];
  thumbnail: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas: Record<string, unknown>;
  walkthrough: WalkthroughStep[];
  featured: boolean;
  display_order: number;
  status: WorkflowStatus;
  views_count: number;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export type CreateWorkflowTemplateInput = Omit<
  WorkflowTemplate,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWorkflowTemplateInput = Partial<CreateWorkflowTemplateInput>;

/** Public-facing template: media resolved, category joined. */
export interface PublicWorkflowTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: WorkflowCategory | null;
  difficulty: Difficulty;
  tags: string[];
  thumbnailUrl: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas: Record<string, unknown>;
  walkthrough: WalkthroughStep[];
  featured: boolean;
  display_order: number;
  views_count: number;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface SharedWorkflow {
  id: string;
  share_code: string;
  title: string;
  name: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas: Record<string, unknown>;
  created_at: string;
}

export interface UserWorkflow {
  id: string;
  share_code: string;
  title: string;
  name: string | null;
  email: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  canvas: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CreateUserWorkflowInput = Omit<UserWorkflow, "id" | "created_at" | "updated_at">;
