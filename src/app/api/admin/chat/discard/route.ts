import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { discardPlan } from "@/lib/ai/plans/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Discards a pending Admin AI draft plan (nothing is ever applied). */
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

    const result = await discardPlan(user.id, planId);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to discard plan" }, { status: 500 });
  }
}
