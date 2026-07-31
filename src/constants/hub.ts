export const RESOURCE_TYPES = [
  "template",
  "agent",
  "integration",
  "prompt",
  "workflow",
  "starter_kit",
  "guide",
  "course",
  "ebook",
  "tool",
  "other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  template: "Template",
  agent: "AI Agent",
  integration: "Integration",
  prompt: "Prompt",
  workflow: "Workflow",
  starter_kit: "Starter Kit",
  guide: "Guide",
  course: "Course",
  ebook: "E-book",
  tool: "Tool",
  other: "Other",
};

export const RESOURCE_STATUSES = ["draft", "published", "archived"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_CATEGORY_STATUSES = ["draft", "published"] as const;
export type SimpleStatus = (typeof RESOURCE_CATEGORY_STATUSES)[number];

export const ACCESS_LEVELS = ["free", "premium"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const PRICING_MODELS = ["free", "one_time", "subscription"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const NODE_CATEGORIES = ["triggers", "ai", "data", "logic", "actions"] as const;
export type NodeCategory = (typeof NODE_CATEGORIES)[number];

export const NODE_CATEGORY_LABELS: Record<NodeCategory, string> = {
  triggers: "Triggers",
  ai: "AI",
  data: "Data",
  logic: "Logic",
  actions: "Actions",
};

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const WORKFLOW_STATUSES = ["draft", "published"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
