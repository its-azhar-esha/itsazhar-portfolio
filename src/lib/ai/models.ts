export interface ModelConfig {
  id: string;
  name: string;
  provider: "groq" | "openrouter";
  tier: "fast" | "accurate" | "fallback";
  maxTokens: number;
  temperature: number;
}

export const models: ModelConfig[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    tier: "fast",
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: "llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    provider: "groq",
    tier: "fast",
    maxTokens: 8192,
    temperature: 0.7,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V4 Flash",
    provider: "openrouter",
    tier: "accurate",
    maxTokens: 8192,
    temperature: 0.7,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "openrouter",
    tier: "accurate",
    maxTokens: 8192,
    temperature: 0.7,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "openrouter",
    tier: "accurate",
    maxTokens: 8192,
    temperature: 0.7,
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "openrouter",
    tier: "fallback",
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    provider: "openrouter",
    tier: "fallback",
    maxTokens: 4096,
    temperature: 0.7,
  },
];

export function getModelForTier(tier: ModelConfig["tier"]): ModelConfig | undefined {
  return models.find((m) => m.tier === tier);
}

export function getFastestModel(provider: "groq" | "openrouter"): ModelConfig | undefined {
  return (
    models.find((m) => m.provider === provider && m.tier === "fast") ||
    models.find((m) => m.provider === provider)
  );
}
