import { z } from "zod";

export const heroActionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string().min(1, "URL is required"),
});

export const heroBackgroundSchema = z.object({
  image: z.string(),
  video: z.string(),
});

export const heroBasicSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  highlight: z.string().min(1, "Highlight is required"),
  subheadline: z.string().min(1, "Subheadline is required"),
  availability: z.string().min(1, "Availability text is required"),
  location: z.string(),
});

export const heroSeoSchema = z.object({
  title: z.string().min(1, "SEO title is required"),
  description: z.string().min(1, "SEO description is required"),
});

export const heroContentSchema = z.object({
  basic: heroBasicSchema,
  actions: z.object({
    primary: heroActionSchema,
    secondary: heroActionSchema,
  }),
  badges: z.array(z.string()),
  background: heroBackgroundSchema,
  seo: heroSeoSchema,
});

export type HeroContentInput = z.infer<typeof heroContentSchema>;
