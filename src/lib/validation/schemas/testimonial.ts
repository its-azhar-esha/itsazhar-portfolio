import { z } from "zod";
import { TESTIMONIAL_STATUSES } from "@/types/testimonial";
import { optionalMediaUrlOrReferenceSchema } from "./media";

export const createTestimonialSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  role: z.string().max(200, "Role must be 200 characters or fewer").default(""),
  company: z.string().max(200, "Company must be 200 characters or fewer").nullable().default(null),
  quote: z.string().min(1, "Quote is required").max(2000, "Quote must be 2000 characters or fewer"),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .default(5),
  avatar: optionalMediaUrlOrReferenceSchema,
  display_order: z
    .number()
    .int("Display order must be a whole number")
    .nonnegative("Display order must be zero or greater")
    .default(0),
  status: z.enum(TESTIMONIAL_STATUSES as unknown as [string, ...string[]]).default("draft"),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();
