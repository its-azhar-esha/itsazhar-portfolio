import { z } from "zod";
import { slugSchema } from "./project";
import { SERVICE_ICON_NAMES, SERVICE_STATUSES } from "@/constants/services";

export const serviceContentSchema = z.object({
  highlights: z.array(z.string().trim().min(1, "Highlight cannot be empty")).default([]),
});

export const createServiceSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(500, "Short description must be 500 characters or fewer"),
  content: serviceContentSchema.default({ highlights: [] }),
  icon: z.enum(SERVICE_ICON_NAMES as unknown as [string, ...string[]]).default("bot"),
  featured: z.boolean().default(false),
  display_order: z
    .number()
    .int("Display order must be a whole number")
    .nonnegative("Display order must be zero or greater")
    .default(0),
  status: z.enum(SERVICE_STATUSES as unknown as [string, ...string[]]).default("draft"),
  seo_title: z
    .string()
    .max(70, "SEO title must be 70 characters or fewer")
    .nullable()
    .default(null)
    .or(z.literal("")),
  seo_description: z
    .string()
    .max(160, "SEO description must be 160 characters or fewer")
    .nullable()
    .default(null)
    .or(z.literal("")),
  seo_keywords: z.array(z.string().trim().min(1)).default([]),
});

export const updateServiceSchema = createServiceSchema.partial();
