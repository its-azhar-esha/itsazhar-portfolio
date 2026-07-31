"use client";

import * as React from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { ChatMessage } from "@/components/ai/chat-message";
import { TypingIndicator } from "@/components/ai/typing-indicator";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROMPT_SUGGESTIONS = [
  "Summarize my current CMS content",
  "Draft SEO metadata for the homepage",
  "Suggest improvements to my hero section",
  "Draft a description for my next project",
];

export function AdminChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
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
  }, [messages, isLoading, scrollToBottom]);

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

      try {
        const response = await fetch("/api/admin/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
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

        const assistantMessage: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMessage]);

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          if (!text) continue;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + text };
            }
            return updated;
          });
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
    [messages, isLoading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="border-border/50 bg-card flex h-[calc(100dvh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border">
      <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
            <Sparkles className="text-primary h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">CMS Assistant</p>
            <p className="text-muted-foreground text-[10px]">
              Knows your projects, services, SEO &amp; content
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
              I can summarize your CMS content, draft project or service copy, generate SEO
              metadata, and suggest improvements.
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
      </div>

      <form onSubmit={handleSubmit} className="border-border/40 border-t p-3">
        <div className="bg-background focus-within:border-primary/50 flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your content, or ask me to draft copy..."
            disabled={isLoading}
            aria-label="Ask the CMS assistant"
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
