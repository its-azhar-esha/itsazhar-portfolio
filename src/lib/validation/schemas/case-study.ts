import { z } from "zod";
import { slugSchema } from "./project";
import { CASE_STUDY_ICON_NAMES, CASE_STUDY_STATUSES } from "@/constants/case-studies";

export const createCaseStudySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  subtitle: z.string().max(100, "Subtitle must be 100 characters or fewer").default(""),
  challenge: z
    .string()
    .min(1, "The challenge is required")
    .max(2000, "The challenge must be 2000 characters or fewer"),
  solution: z
    .string()
    .min(1, "The solution is required")
    .max(2000, "The solution must be 2000 characters or fewer"),
  workflow: z.array(z.string().trim().min(1, "Workflow steps cannot be empty")).default([]),
  impact: z
    .string()
    .min(1, "The impact is required")
    .max(2000, "The impact must be 2000 characters or fewer"),
  icon: z.enum(CASE_STUDY_ICON_NAMES as unknown as [string, ...string[]]).default("fleet"),
  display_order: z
    .number()
    .int("Display order must be a whole number")
    .nonnegative("Display order must be zero or greater")
    .default(0),
  status: z.enum(CASE_STUDY_STATUSES as unknown as [string, ...string[]]).default("draft"),
});

export const updateCaseStudySchema = createCaseStudySchema.partial();
