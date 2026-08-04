import { z } from "zod";

export const aiProviderIdSchema = z.enum(["groq", "openrouter"]);

export const aiProviderConfigSchema = z.object({
  id: aiProviderIdSchema,
  enabled: z.boolean(),
  model: z.string().trim().max(120),
  priority: z.number().int().min(1, "Priority must be at least 1").max(10),
});

export const aiKnowledgeSourcesSchema = z.object({
  custom: z.boolean(),
  website: z.boolean(),
  services: z.boolean(),
  projects: z.boolean(),
  blog: z.boolean(),
  hub: z.boolean(),
  faq: z.boolean(),
});

export const aiConfigSchema = z.object({
  enabled: z.boolean(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(256, "Max tokens must be at least 256").max(16384),
  providers: z.array(aiProviderConfigSchema).min(1, "At least one provider is required").max(10),
  knowledge: aiKnowledgeSourcesSchema,
});

export const saveAiConfigInputSchema = z.object({
  ai_config: aiConfigSchema,
  custom_knowledge: z.string().max(20_000, "Custom knowledge is too long (max 20,000 chars)"),
});

export const testAiProviderInputSchema = z.object({
  id: aiProviderIdSchema,
});

export type AiConfigFormValues = z.infer<typeof aiConfigSchema>;
export type AiKnowledgeSourcesFormValues = z.infer<typeof aiKnowledgeSourcesSchema>;
