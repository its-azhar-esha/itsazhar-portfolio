"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent = ""
  let codeLanguage = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-2 overflow-x-auto rounded-lg border bg-zinc-950 p-3 text-xs dark:bg-zinc-900"
          >
            <code>{codeContent}</code>
          </pre>
        )
        codeContent = ""
        codeLanguage = ""
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLanguage = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line
      continue
    }

    if (line.trim() === "") {
      elements.push(<div key={`space-${i}`} className="h-2" />)
      continue
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const items = []
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(renderInline(lines[i].trim().slice(2)))
        i++
      }
      i--
      elements.push(
        <ul key={`ul-${i}`} className="my-1 list-disc pl-5 text-sm">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+[.)]\s/.test(line.trim())) {
      const items = []
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        items.push(renderInline(lines[i].trim().replace(/^\d+[.)]\s/, "")))
        i++
      }
      i--
      elements.push(
        <ol key={`ol-${i}`} className="my-1 list-decimal pl-5 text-sm">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ol>
      )
      continue
    }

    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    )
  }

  if (inCodeBlock) {
    elements.push(
      <pre key="code-end" className="my-2 overflow-x-auto rounded-lg border bg-zinc-950 p-3 text-xs dark:bg-zinc-900">
        <code>{codeContent}</code>
      </pre>
    )
  }

  return elements
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code key={key++} className="rounded border bg-muted px-1 py-0.5 text-xs font-mono">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    parts.push(remaining[0])
    remaining = remaining.slice(1)
  }

  return parts
}

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex items-start gap-3 px-4 py-2",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {role === "assistant" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[75%]",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "border bg-card"
        )}
      >
        {role === "user" ? (
          <p className="text-sm">{content}</p>
        ) : (
          <div className="space-y-1 [&_p]:text-sm [&_p]:leading-relaxed">
            {renderMarkdown(content)}
            {isStreaming && (
              <span className="inline-block h-3.5 w-1.5 animate-pulse bg-primary" />
            )}
          </div>
        )}
      </div>

      {role === "user" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          U
        </div>
      )}
    </motion.div>
  )
}
