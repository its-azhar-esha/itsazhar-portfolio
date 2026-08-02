import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lightweight, durable rate limiting for the public AI chat endpoint.
 *
 * Uses the `analytics_events` table (which the nightly /api/backup prunes
 * past its retention window) as a sliding-window counter keyed by a hash of
 * the client IP, so the limit survives cold starts and instance scaling.
 * Never stores raw IPs — only a sha256 digest.
 */

const CHAT_EVENT = "chat_request";

/** Generous per-visitor budgets: plenty for real users, a brake on abuse. */
const HOURLY_LIMIT = 20;
const DAILY_LIMIT = 60;

export interface ChatRateLimitResult {
  allowed: boolean;
  status: "ok" | "hourly" | "daily";
  retryAfterSeconds: number | null;
}

export function clientIpKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  const ip = fwd || real || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Checks the window and records this request. Returns `allowed:false` (with
 * a retry hint) when the budget is exhausted. Failures degrade to allowed —
 * the limiter must never break chat when the ledger is unavailable.
 */
export async function checkChatRateLimit(request: Request): Promise<ChatRateLimitResult> {
  try {
    const admin = createAdminClient();
    const key = clientIpKey(request);
    const now = Date.now();
    const hourAgo = new Date(now - 3_600_000).toISOString();
    const dayAgo = new Date(now - 86_400_000).toISOString();

    const [hourly, daily] = await Promise.all([
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event", CHAT_EVENT)
        .eq("metadata->>ipHash", key)
        .gte("created_at", hourAgo),
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event", CHAT_EVENT)
        .eq("metadata->>ipHash", key)
        .gte("created_at", dayAgo),
    ]);

    const hourlyCount = hourly.count ?? 0;
    const dailyCount = daily.count ?? 0;

    if (dailyCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        status: "daily",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((now + 86_400_000 - new Date(dayAgo).getTime()) / 1000),
        ),
      };
    }
    if (hourlyCount >= HOURLY_LIMIT) {
      return {
        allowed: false,
        status: "hourly",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((now + 3_600_000 - new Date(hourAgo).getTime()) / 1000),
        ),
      };
    }

    // Record this request (best-effort; never blocks the chat).
    await admin.from("analytics_events").insert({
      event: CHAT_EVENT,
      page_path: "/api/chat",
      label: "chat",
      metadata: { ipHash: key },
    } as never);

    return { allowed: true, status: "ok", retryAfterSeconds: null };
  } catch {
    // Limiter unavailable → allow the request rather than breaking chat.
    return { allowed: true, status: "ok", retryAfterSeconds: null };
  }
}
