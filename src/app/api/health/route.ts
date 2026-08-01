import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight liveness endpoint.
 *
 * Purpose 1: external uptime monitors (UptimeRobot etc.) can watch
 * https://<site>/api/health.
 * Purpose 2: keep-alive pings (Vercel cron / GitHub Actions) hit this
 * endpoint daily so the Supabase project never goes a full week without
 * API requests — the Free plan pauses projects after ~7 days of
 * inactivity. Any request to Supabase resets that timer.
 */
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  let db = "ok";
  let dbLatencyMs = 0;

  try {
    const supabase = await createClient();
    const queryStartedAt = Date.now();
    const { error } = await supabase.from("blog_posts").select("id").limit(1);
    dbLatencyMs = Date.now() - queryStartedAt;
    if (error) db = "error";
  } catch {
    db = "error";
  }

  return NextResponse.json(
    {
      ok: db === "ok",
      service: "itsazhar-portfolio",
      db,
      dbLatencyMs,
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
