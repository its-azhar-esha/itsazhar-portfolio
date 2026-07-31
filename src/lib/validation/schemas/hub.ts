import { z } from "zod";
import { slugSchema } from "./project";
import { mediaUrlOrReferenceSchema } from "./media";
import {
  RESOURCE_TYPES,
  RESOURCE_STATUSES,
  RESOURCE_CATEGORY_STATUSES,
  ACCESS_LEVELS,
  PRICING_MODELS,
  NODE_CATEGORIES,
  DIFFICULTIES,
  WORKFLOW_STATUSES,
} from "@/constants/hub";

const simpleStatusSchema = z.enum(RESOURCE_CATEGORY_STATUSES as unknown as [string, ...string[]]);

/* ── Hub categories / collections ───────────────────────── */

export const createResourceCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: slugSchema,
  description: z.string().trim().max(500).default(""),
  icon: z.string().trim().max(50).default("box"),
  display_order: z.number().int().default(0),
  status: simpleStatusSchema.default("published"),
});

export const updateResourceCategorySchema = createResourceCategorySchema.partial();

export const createResourceCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).default(""),
  cover_image: mediaUrlOrReferenceSchema.nullish().transform((v) => (v ? v : null)),
  featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
  status: simpleStatusSchema.default("published"),
  resource_ids: z.array(z.string().uuid()).default([]),
});

export const updateResourceCollectionSchema = createResourceCollectionSchema.partial();

/* ── Hub resources ──────────────────────────────────────── */

export const changelogEntrySchema = z.object({
  version: z.string().trim().min(1).max(40),
  date: z.string().trim().min(1).max(20),
  notes: z.array(z.string().trim().min(1).max(400)).max(30).default([]),
});

export const resourcePricingSchema = z
  .object({
    model: z.enum(PRICING_MODELS as unknown as [string, ...string[]]).default("free"),
    price: z.string().trim().max(30).nullish(),
    currency: z.string().trim().max(10).nullish(),
    purchase_url: z.string().url("Must be a valid URL").nullish(),
  })
  .default({ model: "free" });

export const createResourceSchema = z.object({
  type: z.enum(RESOURCE_TYPES as unknown as [string, ...string[]]),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  summary: z.string().trim().max(400).default(""),
  content: z.string().trim().min(1, "Content is required"),
  category_id: z.string().uuid("Invalid category").nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  cover_image: mediaUrlOrReferenceSchema.nullish().transform((v) => (v ? v : null)),
  og_image: mediaUrlOrReferenceSchema.nullish().transform((v) => (v ? v : null)),
  version: z.string().trim().max(40).nullish(),
  changelog: z.array(changelogEntrySchema).max(50).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  pricing: resourcePricingSchema,
  access_level: z.enum(ACCESS_LEVELS as unknown as [string, ...string[]]).default("free"),
  featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
  status: z.enum(RESOURCE_STATUSES as unknown as [string, ...string[]]).default("draft"),
  seo_title: z.string().trim().max(70).nullish(),
  seo_description: z.string().trim().max(160).nullish(),
  canonical_url: z.string().url("Must be a valid URL").nullish(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  files: z
    .array(
      z.object({
        id: z.string().uuid().nullish(),
        label: z.string().trim().min(1, "File label is required").max(150),
        description: z.string().trim().max(300).default(""),
        file_ref: mediaUrlOrReferenceSchema,
        file_size: z.number().int().min(0).default(0),
        file_type: z.string().trim().max(100).default("application/octet-stream"),
        display_order: z.number().int().default(0),
      }),
    )
    .max(25)
    .default([]),
});

export const updateResourceSchema = createResourceSchema.partial();

/* ── Playground: node types / categories / templates ────── */

export const createWorkflowNodeTypeSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z][a-z0-9_]*$/, "Lowercase key, e.g. http_request"),
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z.enum(NODE_CATEGORIES as unknown as [string, ...string[]]).default("data"),
  icon: z.string().trim().max(50).default("circle"),
  color: z.string().trim().max(20).default("#8b5cf6"),
  description: z.string().trim().max(400).default(""),
  config_schema: z.record(z.string(), z.unknown()).default({}),
  default_config: z.record(z.string(), z.unknown()).default({}),
  display_order: z.number().int().default(0),
  status: z.enum(WORKFLOW_STATUSES as unknown as [string, ...string[]]).default("published"),
});

export const updateWorkflowNodeTypeSchema = createWorkflowNodeTypeSchema.partial();

export const createWorkflowCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: slugSchema,
  description: z.string().trim().max(500).default(""),
  icon: z.string().trim().max(50).default("box"),
  display_order: z.number().int().default(0),
  status: simpleStatusSchema.default("published"),
});

export const updateWorkflowCategorySchema = createWorkflowCategorySchema.partial();

export const workflowNodeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(80),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.string(), z.unknown()).default({}),
  label: z.string().trim().max(80).nullish(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  source: z.string().trim().min(1).max(80),
  target: z.string().trim().min(1).max(80),
});

export const walkthroughStepSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(800),
});

export const createWorkflowTemplateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  description: z.string().trim().max(500).default(""),
  category_id: z.string().uuid("Invalid category").nullish(),
  difficulty: z.enum(DIFFICULTIES as unknown as [string, ...string[]]).default("beginner"),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  thumbnail: mediaUrlOrReferenceSchema.nullish().transform((v) => (v ? v : null)),
  nodes: z.array(workflowNodeSchema).max(200).default([]),
  edges: z.array(workflowEdgeSchema).max(400).default([]),
  canvas: z.record(z.string(), z.unknown()).default({}),
  walkthrough: z.array(walkthroughStepSchema).max(20).default([]),
  featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
  status: z.enum(WORKFLOW_STATUSES as unknown as [string, ...string[]]).default("draft"),
  seo_title: z.string().trim().max(70).nullish(),
  seo_description: z.string().trim().max(160).nullish(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const updateWorkflowTemplateSchema = createWorkflowTemplateSchema.partial();

/* ── Playground: shared user workflows ──────────────────── */

export const createSharedWorkflowSchema = z.object({
  title: z.string().trim().max(200).default("Untitled workflow"),
  name: z.string().trim().max(100).nullish(),
  email: z.string().trim().email("Invalid email").max(200).nullish(),
  nodes: z.array(workflowNodeSchema).max(200).default([]),
  edges: z.array(workflowEdgeSchema).max(400).default([]),
  canvas: z.record(z.string(), z.unknown()).default({}),
});
