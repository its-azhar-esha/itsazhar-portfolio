import { z } from "zod";
import { SEO_ROBOTS } from "@/constants/seo";
import { optionalMediaUrlOrReferenceSchema } from "./media";

export const seoPageKeySchema = z
  .string()
  .min(1, "Page key is required")
  .max(100, "Page key must be 100 characters or fewer")
  .regex(
    /^[a-z][a-z0-9_/-]*$/,
    "Page key must start with a letter and contain only lowercase letters, numbers, underscores, and slashes",
  );

export const seoRobotsSchema = z.enum(SEO_ROBOTS as unknown as [string, ...string[]]);

export const createSeoSchema = z.object({
  page_key: seoPageKeySchema,
  title: z
    .string()
    .min(1, "SEO title is required")
    .max(70, "SEO title must be 70 characters or fewer"),
  description: z
    .string()
    .max(160, "Description must be 160 characters or fewer")
    .nullable()
    .default(null)
    .or(z.literal("")),
  keywords: z.array(z.string().trim().min(1)).default([]),
  og_image: optionalMediaUrlOrReferenceSchema,
  canonical_url: z.string().url("Must be a valid URL").nullable().default(null).or(z.literal("")),
  robots: seoRobotsSchema.default("index,follow"),
});

export const updateSeoSchema = createSeoSchema.partial();
