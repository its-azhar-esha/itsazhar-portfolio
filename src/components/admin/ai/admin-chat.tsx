"use client";

import * as React from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatMessage } from "@/components/ai/chat-message";
import { TypingIndicator } from "@/components/ai/typing-indicator";
import { PlanPreview } from "./plan-preview";
import type { PlanEnvelope, PlanActionResult } from "@/lib/ai/tools/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PLAN_START = "__PLAN__";
const PLAN_END = "__PLAN_END__";

const PROMPT_SUGGESTIONS = [
  "Summarize my current CMS content",
  "Draft a new project entry",
  "Update the hero headline",
  "Run a storage cleanup scan",
  "Show me my keep-alive and analytics status",
];

export function AdminChat() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [plan, setPlan] = React.useState<PlanEnvelope | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [results, setResults] = React.useState<PlanActionResult[] | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, plan, results, scrollToBottom]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      if (plan) setResults(null);

      try {
        const response = await fetch("/api/admin/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            planId: plan?.id ?? null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || `HTTP ${response.status}`);
        }

        const contentType = response.headers.get("Content-Type") || "";

        if (contentType.includes("application/json")) {
          const data = await response.json();
          setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let raw = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
        }

        const { text, envelope } = extractEnvelope(raw);
        if (envelope) {
          setPlan(envelope);
        }
        if (text) {
          setMessages((prev) => [...prev, { role: "assistant", content: text }]);
        } else if (!envelope) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn't produce an answer right now. Please try again.",
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble reaching the AI provider right now. Please try again in a moment.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, plan],
  );

  const handleApprove = React.useCallback(async () => {
    if (!plan || applying) return;
    setApplying(true);
    try {
      const response = await fetch("/api/admin/chat/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      setResults(data.results ?? []);
      router.refresh();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `The plan could not be applied: ${
            err instanceof Error ? err.message : "unknown error"
          }`,
        },
      ]);
    } finally {
      setApplying(false);
    }
  }, [plan, applying, router]);

  const handleDiscard = React.useCallback(async () => {
    if (!plan) return;
    try {
      await fetch("/api/admin/chat/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
    } catch {
      // best-effort — plan state is cleared locally regardless
    }
    setPlan(null);
    setResults(null);
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
    setPlan(null);
    setResults(null);
  };

  return (
    <div className="border-border/50 bg-card flex h-[calc(100dvh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border">
      <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
            <Sparkles className="text-primary h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Assistant</p>
            <p className="text-muted-foreground text-[10px]">
              Plans every change · previews before applying · never acts without approval
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            aria-label="Clear chat history"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Sparkles className="text-primary h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">How can I help you manage the site?</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              I can manage projects, services, blog posts, SEO, settings, content and storage
              cleanups. Every change is shown as a preview plan first — nothing is modified until
              you approve it.
            </p>
            <div className="mt-5 flex w-full max-w-md flex-col gap-1.5">
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="border-border/60 hover:border-primary/30 hover:text-foreground text-muted-foreground rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}

        {plan && (
          <div className="px-4">
            <PlanPreview
              plan={plan}
              applying={applying}
              results={results}
              onApprove={() => void handleApprove()}
              onDiscard={() => void handleDiscard()}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-border/40 border-t p-3">
        <div className="bg-background focus-within:border-primary/50 flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              plan && !results
                ? "Adjust the plan (e.g. 'change the headline to...') or approve it above..."
                : "Ask to manage content, settings, SEO, storage..."
            }
            disabled={isLoading}
            aria-label="Ask the admin assistant"
            className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="text-muted-foreground hover:bg-primary hover:text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Splits the raw stream into the optional plan envelope and the answer text. */
function extractEnvelope(raw: string): { text: string; envelope: PlanEnvelope | null } {
  const startIdx = raw.indexOf(PLAN_START);
  if (startIdx === -1) return { text: raw, envelope: null };
  const endIdx = raw.indexOf(PLAN_END, startIdx);
  if (endIdx === -1) return { text: raw, envelope: null };
  const json = raw.slice(startIdx + PLAN_START.length, endIdx);
  let envelope: PlanEnvelope | null = null;
  try {
    envelope = JSON.parse(json) as PlanEnvelope;
  } catch {
    envelope = null;
  }
  const text = (raw.slice(0, startIdx) + raw.slice(endIdx + PLAN_END.length)).trim();
  return { text, envelope };
}
