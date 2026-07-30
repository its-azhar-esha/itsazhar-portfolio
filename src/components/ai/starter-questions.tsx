"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const questions = [
  { label: "What services do you offer?", query: "What services do you offer?" },
  { label: "Can you automate my business?", query: "Can you automate my business?" },
  { label: "Show me your projects", query: "Show me your projects" },
  { label: "How much does automation cost?", query: "How much does automation cost?" },
  { label: "Which tools do you use?", query: "Which tools do you use?" },
  { label: "How long does a project take?", query: "How long does a project take?" },
  { label: "Book a free audit", query: "I'd like to book a free 15-minute automation audit" },
]

interface StarterQuestionsProps {
  onSelect: (query: string) => void
}

export function StarterQuestions({ onSelect }: StarterQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/50 px-4 py-3">
      {questions.map((q, i) => (
        <motion.button
          key={q.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          onClick={() => onSelect(q.query)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-all duration-200",
            q.label === "Book a free audit"
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          {q.label}
        </motion.button>
      ))}
    </div>
  )
}
