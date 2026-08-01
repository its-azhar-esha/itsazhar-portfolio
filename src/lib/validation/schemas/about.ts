import { z } from "zod";

export const aboutBuildStepSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export const aboutToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

export const aboutTimelineEntrySchema = z.object({
  year: z.string().min(1, "Year is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export const aboutPrincipleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

export const aboutSocialLinkSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  url: z
    .string()
    .url("Must be a valid URL")
    .or(z.string().startsWith("mailto:", "Must be a valid URL")),
  placeholder: z.boolean(),
});

export const aboutResumeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string(),
});

export const aboutSeoSchema = z.object({
  title: z.string().min(1, "SEO title is required"),
  description: z.string().min(1, "SEO description is required"),
});

export const aboutBasicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  tagline: z.string().min(1, "Tagline is required"),
  profileImage: z.string(),
  introVideoUrl: z.string(),
});

export const aboutBiographySchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  paragraphs: z.array(z.string()).min(1, "At least one paragraph is required"),
  missionStatement: z.string().min(1, "Mission is required"),
  visionStatement: z.string().min(1, "Vision is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

export const aboutContentSchema = z.object({
  basic: aboutBasicSchema,
  biography: aboutBiographySchema,
  buildSteps: z.array(aboutBuildStepSchema).min(1, "At least one build step is required"),
  tools: z.array(aboutToolSchema),
  industries: z.array(z.string()).min(1, "At least one industry is required"),
  timeline: z.array(aboutTimelineEntrySchema).min(1, "At least one timeline entry is required"),
  principles: z.array(aboutPrincipleSchema).min(1, "At least one principle is required"),
  socialLinks: z.array(aboutSocialLinkSchema),
  resume: aboutResumeSchema,
  seo: aboutSeoSchema,
});

export type AboutContentInput = z.infer<typeof aboutContentSchema>;
