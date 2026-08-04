const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

import { fetchWithRetry, combineAbortSignals } from "./shared";
import { resolveApiKey } from "@/lib/integrations/repository";

export interface StreamOptions {
  temperature: number;
  maxTokens: number;
}

export interface CompleteOptions extends StreamOptions {
  /** Asks the provider for a JSON object response (Groq JSON mode). */
  json?: boolean;
}

export async function completeGroq(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  model?: string,
  options?: CompleteOptions,
): Promise<Response> {
  const apiKey = await resolveApiKey("groq");
  if (!apiKey) {
    console.error("[Groq] No API key (stored secret or GROQ_API_KEY)");
    throw new Error("Groq API key is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const body: Record<string, unknown> = {
      model: model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    };
    if (options?.json) {
      body.response_format = { type: "json_object" };
    }

    let response = await fetchWithRetry(
      GROQ_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: combinedSignal,
      },
      MAX_RETRIES,
    );

    if (!response.ok && options?.json && response.status === 400) {
      delete body.response_format;
      response = await fetchWithRetry(
        GROQ_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: combinedSignal,
        },
        MAX_RETRIES,
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[Groq] Error ${response.status}: ${errorText}`);
    }

    return response;
  } catch (err) {
    console.error("[Groq] Fetch failed:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function streamGroq(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  model?: string,
  options?: StreamOptions,
): Promise<Response> {
  const apiKey = await resolveApiKey("groq");
  if (!apiKey) {
    console.error("[Groq] No API key (stored secret or GROQ_API_KEY)");
    throw new Error("Groq API key is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetchWithRetry(
      GROQ_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
      console.error(`[Groq] Error ${response.status}: ${errorText}`);
    }

    return response;
  } catch (err) {
    console.error("[Groq] Fetch failed:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
