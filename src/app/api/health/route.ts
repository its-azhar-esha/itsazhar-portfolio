import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_ROW_ID, normalizeDxConfig } from "@/types/settings";

/**
 * Lightweight liveness endpoint.
 *
 * Purpose 1: external uptime monitors (UptimeRobot etc.) can watch
 * https://<site>/api/health.
 * Purpose 2: keep-alive pings (Vercel cron / GitHub Actions) hit this
 * endpoint daily so the Supabase project never goes a full week without
 * API requests — the Free plan pauses projects after ~7 days of
 * inactivity. Any request to Supabase resets that timer.
 * Purpose 3: each check is upserted into the health_checks ledger
 * (one row per day, service-role write) so the DX page can show
 * keep-alive history.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
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

  if (db === "ok") {
    try {
      const admin = createAdminClient();
      const { data: settingsRow } = (await admin
        .from("site_settings")
        .select("dx_config")
        .eq("id", SETTINGS_ROW_ID)
        .maybeSingle()) as unknown as { data: { dx_config: unknown } | null };
      const dxConfig = normalizeDxConfig(settingsRow?.dx_config);
      if (dxConfig.recordHealthChecks) {
        await admin.from("health_checks").upsert(
          {
            checked_on: new Date().toISOString().slice(0, 10),
            ok: true,
            latency_ms: dbLatencyMs,
            detail: `db ok (${dbLatencyMs}ms)`,
          } as never,
          { onConflict: "checked_on" },
        );
      }
    } catch {
      // Ledger write must never flip the health status.
    }
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
