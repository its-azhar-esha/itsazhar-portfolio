import { NextRequest } from "next/server";
import { routeToAI, buildSystemPrompt } from "@/lib/ai/router";
import { findRelevantKnowledge, detectIntent } from "@/lib/ai/knowledge";
import { buildCmsKnowledge, captureChatLead } from "@/lib/ai/cms-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUGGESTIONS_BY_INTENT: Record<string, string[]> = {
  services: [
    "How do your AI agents work?",
    "Which industries do you automate?",
    "Can you automate my business?",
  ],
  projects: [
    "Tell me about Fleet Guard",
    "What was the Lease Intelligence project?",
    "Show me your tech stack",
  ],
  contact: ["Book a free audit", "What services do you offer?", "Show me your projects"],
  pricing: [
    "How does the free audit work?",
    "What services do you offer?",
    "How long does a project take?",
  ],
  about: ["What services do you offer?", "Show me your projects", "What tools do you use?"],
  stack: ["How does n8n automation work?", "What services do you offer?", "Show me your projects"],
  faq: ["How does pricing work?", "How long does a project take?", "Book a free audit"],
  industries: [
    "Show me logistics projects",
    "What services do you offer?",
    "Can you automate healthcare?",
  ],
  audit: [
    "How does pricing work?",
    "What happens after the audit?",
    "How long does a project take?",
  ],
  general: ["What services do you offer?", "Show me your projects", "Book a free audit"],
};

function pickSuggestions(intent: string, used: string[]): string[] {
  const pool = SUGGESTIONS_BY_INTENT[intent] || SUGGESTIONS_BY_INTENT.general;
  const available = pool.filter((s) => !used.includes(s));
  if (available.length >= 2) return available.slice(0, 2);
  const remaining = pool.filter((s) => !available.includes(s));
  return [...available, ...remaining].slice(0, 2);
}

async function buildKnowledgeResponse(message: string): Promise<{
  content: string;
  intent: string;
  suggestions: string[];
}> {
  const intent = detectIntent(message);
  const [cms, staticKnowledge] = [await buildCmsKnowledge(message), findRelevantKnowledge(message)];
  const knowledge = [cms, staticKnowledge].filter(Boolean).join("\n\n---\n\n");
  const suggestions = pickSuggestions(intent, []);
  return { content: knowledge, intent, suggestions };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content || "";
    const allUserMessages = messages
      .filter((m: { role: string }) => m.role === "user")
      .map((m: { content: string }) => m.content);
    const usedSuggestions = allUserMessages.slice(0, -1);

    const intent = detectIntent(userMessage);
    const cmsKnowledge = await buildCmsKnowledge(userMessage);
    const knowledge = [cmsKnowledge, findRelevantKnowledge(userMessage)]
      .filter(Boolean)
      .join("\n\n---\n\n");

    await captureChatLead(messages, intent);

    const systemPrompt = buildSystemPrompt(knowledge);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    try {
      const { stream, provider } = await routeToAI(apiMessages);

      const encoder = new TextEncoder();
      const reader = stream.getReader();
      let fullResponse = "";
      const suggestions = pickSuggestions(intent, usedSuggestions);

      const responseStream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          let buffer = "";

          const sendMetadata = () => {
            const meta = JSON.stringify({ intent, suggestions, provider });
            controller.enqueue(encoder.encode(`__META__${meta}__META__\n`));
          };

          try {
            sendMetadata();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta =
                    parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
                  if (delta) {
                    fullResponse += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  continue;
                }
              }
            }
          } catch {
            if (!fullResponse) {
              const fallback = await buildKnowledgeResponse(userMessage);
              controller.enqueue(encoder.encode(fallback.content));
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
      });

      return new Response(responseStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      const fallback = buildKnowledgeResponse(userMessage);
      const body = JSON.stringify(fallback);
      return new Response(body, {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    const body = JSON.stringify({
      content: "Sorry, something went wrong. Please try again or book a free audit.",
      intent: "general",
      suggestions: ["What services do you offer?", "Book a free audit"],
    });
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
