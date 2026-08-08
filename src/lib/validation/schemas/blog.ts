import { z } from "zod";
import { slugSchema } from "./project";
import { optionalMediaUrlOrReferenceSchema } from "./media";
import { BLOG_POST_STATUSES } from "@/constants/blog";

const blogSlugSchema = slugSchema;

export const createBlogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  slug: blogSlugSchema,
  excerpt: z.string().trim().max(500, "Excerpt must be 500 characters or fewer").default(""),
  content: z.string().trim().min(1, "Content is required"),
  cover_image: optionalMediaUrlOrReferenceSchema,
  categories: z
    .array(z.string().trim().min(1).max(60))
    .max(10, "Maximum 10 categories")
    .default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20, "Maximum 20 tags").default([]),
  sources: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Source title is required").max(200),
        url: z.string().trim().url("Must be a valid URL (include https://)"),
      }),
    )
    .max(20, "Maximum 20 sources")
    .default([]),
  author: z.string().trim().min(1, "Author is required").max(100).default("Azhar"),
  status: z.enum(BLOG_POST_STATUSES as unknown as [string, ...string[]]).default("draft"),
  featured: z.boolean().default(false),
  published_at: z.string().datetime({ offset: true }).nullish(),
  scheduled_for: z.string().datetime({ offset: true }).nullish(),
  seo_title: z.string().trim().max(70, "SEO title must be 70 characters or fewer").nullish(),
  seo_description: z
    .string()
    .trim()
    .max(160, "SEO description must be 160 characters or fewer")
    .nullish(),
  og_image: optionalMediaUrlOrReferenceSchema,
  canonical_url: z.string().url("Must be a valid URL").nullish(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();
