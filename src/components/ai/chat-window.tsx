"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, Trash2, ExternalLink } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { StarterQuestions } from "./starter-questions"
import { SuggestionButtons } from "./SuggestionButtons"
import { cn } from "@/lib/utils"
import { trackQuestion, trackSuggestionClick } from "@/lib/ai/analytics"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatWindowProps {
  onClose: () => void
}

const QUICK_ACTIONS = [
  { label: "View Projects", href: "/projects" },
  { label: "Book Audit", href: "/contact" },
  { label: "About Me", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
]

const DRAG_THRESHOLD = 80

export function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasStarted, setHasStarted] = React.useState(false)
  const [lastIntent, setLastIntent] = React.useState("general")
  const [lastSuggestions, setLastSuggestions] = React.useState<string[]>([])
  const [usedSuggestions, setUsedSuggestions] = React.useState<string[]>([])
  const [dragY, setDragY] = React.useState(0)
  const [isMobile, setIsMobile] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const suggestionsKey = React.useRef(0)
  const sheetRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: Message = { role: "user", content: content.trim() }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setInput("")
      setIsLoading(true)
      setHasStarted(true)
      setLastSuggestions([])

      if (!usedSuggestions.includes(content.trim())) {
        setUsedSuggestions((prev) => [...prev, content.trim()])
      }

        trackQuestion(lastIntent)

        try {
          const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const contentType = response.headers.get("Content-Type") || ""

        if (contentType.includes("application/json")) {
          const data = await response.json()
          setMessages((prev) => [...prev, { role: "assistant", content: data.content }])
          setLastIntent(data.intent || lastIntent)
          setLastSuggestions(data.suggestions || [])
          suggestionsKey.current++
          return
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const assistantMessage: Message = { role: "assistant", content: "" }
        setMessages((prev) => [...prev, assistantMessage])
        suggestionsKey.current++

        const decoder = new TextDecoder()
        let metaRead = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })

          if (!metaRead) {
            const metaMatch = text.match(/__META__({.*?})__META__\n?/)
            if (metaMatch) {
              try {
                const meta = JSON.parse(metaMatch[1])
                setLastIntent(meta.intent || "general")
                const newSuggestions = meta.suggestions || []
                const available = newSuggestions.filter(
                  (s: string) => !usedSuggestions.includes(s) && !s.includes(content.trim())
                )
                setLastSuggestions(available.length >= 2 ? available.slice(0, 2) : newSuggestions.slice(0, 2))
              } catch {}
              metaRead = true
              const remaining = text.replace(/__META__.*?__META__\n?/, "")
              if (remaining) {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: last.content + remaining }
                  }
                  return updated
                })
              }
              continue
            }
          }

          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + text }
            }
            return updated
          })
        }
      } catch {
        const finalMessages = messages.length > 0 ? messages : updatedMessages
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I apologize, but I'm having trouble connecting right now. Please try again or book a free audit directly.",
          },
        ])
        setLastSuggestions(["What services do you offer?", "Book a free audit"])
        suggestionsKey.current++
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, lastIntent, usedSuggestions]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleStarterSelect = (query: string) => {
    sendMessage(query)
  }

  const handleSuggestionClick = (suggestion: string) => {
    trackSuggestionClick()
    sendMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    setHasStarted(false)
    setLastSuggestions([])
    setUsedSuggestions([])
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const sheetExit = dragY > DRAG_THRESHOLD ? { y: 200, opacity: 0, transition: { duration: 0.2 } } : { y: dragY, opacity: 1 - dragY / 300 }

  return (
    <motion.div
      ref={sheetRef}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      drag={isMobile ? "y" : false}
      dragConstraints={isMobile ? { top: 0, bottom: 150 } : undefined}
      dragElastic={isMobile ? 0.2 : undefined}
      onDrag={isMobile ? (_, info) => setDragY(Math.max(0, info.offset.y)) : undefined}
      onDragEnd={isMobile ? (_, info) => {
        if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 300) {
          setDragY(0)
          onClose()
        } else {
          setDragY(0)
        }
      } : undefined}
      style={isMobile ? { y: dragY } : undefined}
      className={cn(
        "fixed z-50 flex flex-col border bg-background/95 shadow-2xl shadow-primary/5 backdrop-blur-2xl",
        "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-safe",
        "md:inset-x-auto md:bottom-24 md:right-4 md:h-[500px] md:w-[340px] md:rounded-2xl md:max-h-none md:cursor-default",
        "lg:bottom-28 lg:h-[640px] lg:w-[420px]"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Azhar AI chat assistant"
    >
      <div className="flex items-center justify-center pt-2 pb-1 md:hidden">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 md:rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Azhar AI</p>
            <p className="text-[10px] text-muted-foreground">AI Automation Consultant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasStarted && (
            <button
              onClick={clearChat}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 scroll-smooth">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center px-4 pt-8 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Hi, I&apos;m Azhar AI
              </h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                I can help you understand my automation services, projects, and find the right solution for your business.
              </p>
              <div className="mt-5 flex w-full max-w-xs flex-col gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.label} href={action.href} onClick={onClose}>
                    <motion.div
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3.5 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:text-foreground"
                    >
                      <span>{action.label}</span>
                      <ExternalLink className="h-3 w-3" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <TypingIndicator />
        )}
      </div>

      {hasStarted && lastSuggestions.length > 0 && !isLoading && messages.length > 0 && (
        <div className="border-t border-border/50">
          <SuggestionButtons
            key={suggestionsKey.current}
            suggestions={lastSuggestions}
            onSelect={handleSuggestionClick}
            isLoading={isLoading}
          />
        </div>
      )}

      {!hasStarted ? (
        <StarterQuestions onSelect={handleStarterSelect} />
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border/50 p-3 pb-safe"
      >
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 transition-colors focus-within:border-primary/50">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Azhar AI..."
            disabled={isLoading}
            aria-label="Ask Azhar AI"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}
