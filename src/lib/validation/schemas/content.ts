import { z } from "zod";
import { CONTENT_STATUSES } from "@/constants/content";

export const contentKeySchema = z
  .string()
  .min(1, "Key is required")
  .max(100, "Key must be 100 characters or fewer")
  .regex(
    /^[a-z][a-z0-9_-]*$/,
    "Key must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores",
  );

export const createContentSchema = z.object({
  key: contentKeySchema,
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  content: z.object({}).catchall(z.unknown()).default({}),
  status: z.enum(CONTENT_STATUSES as unknown as [string, ...string[]]).default("draft"),
});

export const updateContentSchema = createContentSchema.partial();
