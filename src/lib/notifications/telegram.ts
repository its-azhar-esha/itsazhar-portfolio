/**
 * Telegram Bot API client (server-only).
 *
 * Thin, typed wrapper around the Bot API used by the notification
 * sender. Never throws raw network errors — callers receive structured
 * results so delivery can be recorded in the ledger.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface TelegramMeInfo {
  id: number;
  username: string | null;
  firstName: string | null;
}

export interface TelegramSendResult {
  ok: boolean;
  messageId: number | null;
  error: string | null;
}

async function telegramFetch<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
  timeoutMs = 10_000,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!token || token.trim() === "") {
    return { ok: false, error: "Telegram bot token is not configured." };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as {
        ok?: boolean;
        description?: string;
        result?: T;
      } | null;
      if (!response.ok || json?.ok !== true || json.result === undefined) {
        return {
          ok: false,
          error: json?.description ?? `Telegram API error (HTTP ${response.status})`,
        };
      }
      return { ok: true, data: json.result };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Telegram API error";
    return { ok: false, error: message.includes("abort") ? "Request timed out" : message };
  }
}

/** Calls getMe to verify a bot token. Returns bot identity on success. */
export async function testTelegramToken(
  token: string,
): Promise<{ ok: boolean; me?: TelegramMeInfo; error?: string }> {
  const result = await telegramFetch<{
    id: number;
    username?: string | null;
    first_name?: string | null;
  }>(token, "getMe", {});
  if (!result.ok) return { ok: false, error: result.error };
  const me = result.data;
  if (!me) return { ok: false, error: "Telegram returned an empty getMe response." };
  return {
    ok: true,
    me: {
      id: me.id,
      username: me.username ?? null,
      firstName: me.first_name ?? null,
    },
  };
}

/** Sends a plain-text message to a chat. */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  timeoutMs = 10_000,
): Promise<TelegramSendResult> {
  const result = await telegramFetch<{ message_id: number }>(
    token,
    "sendMessage",
    {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    },
    timeoutMs,
  );
  if (!result.ok) return { ok: false, messageId: null, error: result.error ?? "Send failed" };
  return { ok: true, messageId: result.data?.message_id ?? null, error: null };
}
