import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_ROW_ID, normalizeDxConfig } from "@/types/settings";
import { fireMonitoringWebhooks } from "@/lib/monitoring/actions";

/**
 * Lightweight liveness endpoint.
 *
 * Purpose 1: external uptime monitors (UptimeRobot etc.) can watch
 * https://<site>/api/health.
 * Purpose 2: keep-alive pings (Vercel cron / GitHub Actions) hit this
 * endpoint daily so the Supabase project never goes a full week without
 * API requests — the Free plan pauses projects after ~7 days of
 * inactivity. Any request to Supabase resets that timer.
 * Purpose 3: each authoritative cron check is upserted into the
 * health_checks ledger (one row per day per source, service-role write)
 * so the DX page can show keep-alive history attributed to the real
 * scheduler. Ledger writes are gated to authoritative cron invocations
 * (`x-vercel-cron: 1`, or a `HEALTH_CRON_SECRET` header) so random
 * public traffic cannot write fake "healthy" rows into the ledger.
 * Public probes still run the real DB query (resetting the pause timer);
 * they just do not write the ledger.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Returns the authoritative scheduler source for this request, or null
 * when the request is not an authoritative keep-alive invocation.
 */
function authoritativeSource(request: Request): "vercel" | "github" | null {
  if (request.headers.get("x-vercel-cron") === "1") return "vercel";
  const secret = process.env.HEALTH_CRON_SECRET;
  if (secret && request.headers.get("x-health-key") === secret) return "github";
  return null;
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  let db = "ok";
  let dbLatencyMs = 0;
  let detail = "";

  try {
    const supabase = await createClient();
    const queryStartedAt = Date.now();
    const { error } = await supabase.from("blog_posts").select("id").limit(1);
    dbLatencyMs = Date.now() - queryStartedAt;
    if (error) {
      db = "error";
      detail = error.message;
    }
  } catch (err) {
    db = "error";
    detail = err instanceof Error ? err.message : "Unreachable";
  }

  try {
    const admin = createAdminClient();
    const { data: settingsRow } = (await admin
      .from("site_settings")
      .select("dx_config")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle()) as unknown as { data: { dx_config: unknown } | null };
    const dxConfig = normalizeDxConfig(settingsRow?.dx_config);
    // Only authoritative cron invocations write the ledger, so the
    // "last check" freshness reflects the real daily run, and public
    // traffic cannot forge healthy rows. The source is attributed so the
    // keep-alive report can distinguish Vercel cron from GitHub Actions.
    const source = authoritativeSource(request);
    if (dxConfig.recordHealthChecks && source) {
      // Always record a row — success AND failure — so the ledger shows the
      // last actual run time (updated_at) and failure detail, and the
      // dashboard can distinguish "ran and failed" from "never ran".
      await admin.from("health_checks").upsert(
        {
          checked_on: new Date().toISOString().slice(0, 10),
          ok: db === "ok",
          latency_ms: dbLatencyMs || null,
          detail: db === "ok" ? `db ok (${dbLatencyMs}ms)` : `db ${db}: ${detail || "unreachable"}`,
          updated_at: new Date().toISOString(),
          source,
        } as never,
        { onConflict: "checked_on,source" },
      );
    }
  } catch {
    // Ledger write must never flip the health status.
  }

  // Notify configured webhooks when the health check fails (best-effort).
  if (db !== "ok") {
    await fireMonitoringWebhooks("health", {
      detail: detail || "Health check failed",
      source: "api/health",
      latencyMs: dbLatencyMs,
    });
  }

  return NextResponse.json(
    {
      ok: db === "ok",
      service: "itsazhar-portfolio",
      db,
      dbLatencyMs,
      detail,
      timestamp: new Date().toISOString(),
      totalMs: Date.now() - startedAt,
    },
    {
      status: db === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
