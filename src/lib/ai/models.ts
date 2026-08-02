export interface ModelConfig {
  id: string;
  name: string;
  provider: "groq" | "openrouter";
  tier: "fast" | "accurate" | "fallback";
  maxTokens: number;
  temperature: number;
}

// Only models verified reachable with the configured API keys are listed.
// The router passes the selected model id to the provider so the reported
// model always matches the one actually used.
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
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V4 Flash",
    provider: "openrouter",
    tier: "accurate",
    maxTokens: 8192,
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
