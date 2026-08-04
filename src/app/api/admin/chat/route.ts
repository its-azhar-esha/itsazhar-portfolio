import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiConfig } from "@/lib/ai/config";
import { buildPlannerState, planRequest } from "@/lib/ai/planner";
import { savePlan, getPlanEnvelopeOrNull, expireStalePlans } from "@/lib/ai/plans/service";
import type { PlanEnvelope } from "@/lib/ai/tools/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_PREFIX = "__PLAN__";
const PLAN_SUFFIX = "__PLAN_END__";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
      planId?: unknown;
    } | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const config = await getAiConfig();
    if (!config.enabled) {
      return Response.json(
        {
          content:
            "The AI assistant is currently disabled in AI Configuration. Enable it there and try again.",
        },
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    void expireStalePlans();

    const messages = body.messages
      .filter((m) => m && typeof m === "object")
      .map((m) => ({
        role: String((m as { role?: unknown }).role ?? "user"),
        content: String((m as { content?: unknown }).content ?? ""),
      }))
      .filter((m) => m.role === "user" || m.role === "assistant");

    const pendingPlan = typeof body.planId === "string" ? body.planId : null;

    let pendingContext: string | undefined;
    if (pendingPlan) {
      const plan = await getPlanEnvelopeOrNull(user.id, pendingPlan);
      if (plan) {
        pendingContext = plan.actions
          .map(
            (a) =>
              `${a.label} (${a.toolId})\n  before:\n    ${a.before.join("\n    ")}\n  after:\n    ${a.after.join("\n    ")}`,
          )
          .join("\n");
      }
    }

    const state = await buildPlannerState();
    const output = await planRequest(messages, state, pendingContext);

    const encoder = new TextEncoder();

    if (output.actions.length > 0) {
      const saved = await savePlan(user.id, messages[messages.length - 1]?.content ?? "", output);
      if (!saved.success) {
        return Response.json(
          { content: `I could not save the plan: ${saved.error}` },
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      const envelope: PlanEnvelope = saved.data;
      const envelopeText = `${PLAN_PREFIX}${JSON.stringify(envelope)}${PLAN_SUFFIX}`;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(envelopeText));
          if (envelope.explanation.trim()) {
            controller.enqueue(encoder.encode(envelope.explanation));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // No mutating actions — plain informational answer.
    const answer =
      output.explanation.trim() || "I don't have enough information to act on that yet.";
    return new Response(streamText(answer, encoder), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return Response.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}

function streamText(text: string, encoder: TextEncoder): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}
