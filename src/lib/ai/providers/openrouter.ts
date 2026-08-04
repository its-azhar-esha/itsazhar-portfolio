const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct";
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

import { fetchWithRetry, combineAbortSignals } from "./shared";
import { resolveApiKey } from "@/lib/integrations/repository";
import type { StreamOptions } from "./groq";

export async function streamOpenRouter(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  model?: string,
  options?: StreamOptions,
): Promise<Response> {
  const apiKey = await resolveApiKey("openrouter");
  if (!apiKey) {
    console.error("[OpenRouter] No API key (stored secret or OPENROUTER_API_KEY)");
    throw new Error("OpenRouter API key is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetchWithRetry(
      OPENROUTER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://itsazhar.com",
          "X-Title": "Azhar AI",
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          messages,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 1024,
          stream: true,
        }),
        signal: combinedSignal,
      },
      MAX_RETRIES,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[OpenRouter] Error ${response.status}: ${errorText}`);
    }

    return response;
  } catch (err) {
    console.error("[OpenRouter] Fetch failed:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
