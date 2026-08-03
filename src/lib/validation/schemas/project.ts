import { z } from "zod";
import { DB_PROJECT_STATUSES, PROJECT_INDUSTRIES, PROJECT_CATEGORIES } from "@/constants/projects";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(200, "Slug must be 200 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens separating words");

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  slug: slugSchema,
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(500, "Short description must be 500 characters or fewer"),
  description: z.string().nullable().default(null),
  thumbnail: z.string().nullable().default(null),
  images: z.array(z.string()).default([]),
  video_url: z.string().nullable().default(null),
  industry: z
    .array(
      z.enum(PROJECT_INDUSTRIES as unknown as [string, ...string[]], {
        error: "One or more selected industries are no longer valid options.",
      }),
    )
    .min(1, "At least one industry is required"),
  technologies: z.array(z.string()).default([]),
  category: z.enum(PROJECT_CATEGORIES as unknown as [string, ...string[]], {
    error: "Category is not a valid option.",
  }),
  featured: z.boolean().default(false),
  status: z
    .enum(DB_PROJECT_STATUSES as unknown as [string, ...string[]], {
      error: "Status is not a valid option.",
    })
    .default("draft"),
  scheduled_for: z.string().datetime({ offset: true }).nullish(),
  order: z.number().int().nonnegative().default(0),
  client: z.string().nullable().default(null),
  demo_url: z.string().url("Must be a valid URL").nullable().default(null).or(z.literal("")),
  github_url: z.string().url("Must be a valid URL").nullable().default(null).or(z.literal("")),
  seo_title: z
    .string()
    .max(70, "SEO title must be 70 characters or fewer")
    .nullable()
    .default(null),
  seo_description: z
    .string()
    .max(160, "SEO description must be 160 characters or fewer")
    .nullable()
    .default(null),
  og_image: z.string().nullable().default(null),
  canonical_url: z.string().nullable().default(null),
  keywords: z.array(z.string()).default([]),
  challenge: z.string().nullable().default(null),
  solution: z.string().nullable().default(null),
  workflow: z.array(z.string()).default([]),
  impact: z.string().nullable().default(null),
  key_features: z.array(z.string()).default([]),
  future_scope: z.array(z.string()).default([]),
});

/**
 * Relaxed schema for saving incomplete projects as drafts: only the
 * database-required fields (title, slug) are enforced; everything else
 * defaults to empty/null so a new project can be drafted before its content
 * is written. Publishing still goes through the strict `createProjectSchema`.
 */
export const createProjectDraftSchema = createProjectSchema.extend({
  short_description: z
    .string()
    .max(500, "Short description must be 500 characters or fewer")
    .default(""),
  industry: z
    .array(
      z.enum(PROJECT_INDUSTRIES as unknown as [string, ...string[]], {
        error: "One or more selected industries are no longer valid options.",
      }),
    )
    .default([]),
});

export const updateProjectSchema = createProjectSchema.partial();
export const updateProjectDraftSchema = createProjectDraftSchema.partial();

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.enum(DB_PROJECT_STATUSES as unknown as [string, ...string[]]).optional(),
  category: z.enum(PROJECT_CATEGORIES as unknown as [string, ...string[]]).optional(),
  sort: z
    .enum(["created_at_desc", "created_at_asc", "title_asc", "title_desc", "featured_desc"])
    .default("created_at_desc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
