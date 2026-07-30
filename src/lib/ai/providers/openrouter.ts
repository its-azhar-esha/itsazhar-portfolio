const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const MODEL = "meta-llama/llama-3.1-8b-instruct"
const TIMEOUT_MS = 30000
const MAX_RETRIES = 1

import { fetchWithRetry, combineAbortSignals } from "./shared"

export async function streamOpenRouter(
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("[OpenRouter] OPENROUTER_API_KEY is empty or not set")
    throw new Error("OpenRouter API key is not configured")
  }

  console.log("[OpenRouter] Attempting stream with model:", MODEL)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

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
          model: MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 1024,
          stream: true,
        }),
        signal: combinedSignal,
      },
      MAX_RETRIES
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`[OpenRouter] Error ${response.status}: ${errorText}`)
    } else {
      console.log("[OpenRouter] Stream started successfully")
    }

    return response
  } catch (err) {
    console.error("[OpenRouter] Fetch failed:", err)
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}


