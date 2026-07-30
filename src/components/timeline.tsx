"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TimelineItem {
  year?: string
  title: string
  description?: string
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
  variant?: "default" | "workflow"
  renderBadge?: (item: TimelineItem) => React.ReactNode
}

export function Timeline({ items, className, variant = "default", renderBadge }: TimelineProps) {
  const isWorkflow = variant === "workflow"

  return (
    <div className={cn("mx-auto max-w-2xl", className)}>
      {items.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: isWorkflow ? 0 : -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.35 }}
          className={cn("relative flex", isWorkflow ? "gap-6 pb-8 last:pb-0" : "gap-5 pb-10 last:pb-0")}
        >
          {i < items.length - 1 && (
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "absolute origin-top bg-border",
                isWorkflow ? "left-[15px] top-8 bottom-0 w-0.5" : "left-[13px] top-8 bottom-0 w-px"
              )}
            />
          )}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background",
              isWorkflow ? "h-8 w-8" : "h-7 w-7"
            )}
          >
            {isWorkflow ? (
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            ) : (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </motion.div>
          <div className="pt-0.5">
            {item.year && renderBadge ? (
              renderBadge(item)
            ) : item.year ? (
              <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                {item.year}
              </span>
            ) : null}
            <h3 className={cn("font-semibold", isWorkflow ? "text-sm" : "mt-1.5")}>{item.title}</h3>
            {item.description && (
              <p className={cn("mt-1 text-sm text-muted-foreground", isWorkflow && "text-sm")}>
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
