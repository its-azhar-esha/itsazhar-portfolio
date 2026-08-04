import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approvePlan } from "@/lib/ai/plans/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Applies an approved Admin AI plan. The client only calls this after the
 * owner completes the explicit confirmation gesture (slide-to-confirm).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { planId?: unknown } | null;
    const planId = typeof body?.planId === "string" ? body.planId : "";
    if (!planId) {
      return Response.json({ error: "planId is required" }, { status: 400 });
    }

    const result = await approvePlan(user.id, planId);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      results: result.data.results,
      summary: result.data.summary,
    });
  } catch {
    return Response.json({ error: "Failed to approve plan" }, { status: 500 });
  }
}
