"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineItem {
  year?: string;
  title: string;
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  variant?: "default" | "workflow";
  renderBadge?: (item: TimelineItem) => React.ReactNode;
}

export function Timeline({ items, className, variant = "default", renderBadge }: TimelineProps) {
  const isWorkflow = variant === "workflow";

  return (
    <div className={cn("mx-auto max-w-2xl", className)}>
      {items.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: isWorkflow ? 0 : -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.35 }}
          className={cn(
            "relative flex",
            isWorkflow ? "gap-6 pb-8 last:pb-0" : "gap-5 pb-10 last:pb-0",
          )}
        >
          {i < items.length - 1 && (
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "bg-border absolute origin-top",
                isWorkflow ? "top-8 bottom-0 left-[15px] w-0.5" : "top-8 bottom-0 left-[13px] w-px",
              )}
            />
          )}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "border-primary bg-background flex shrink-0 items-center justify-center rounded-full border-2",
              isWorkflow ? "h-8 w-8" : "h-7 w-7",
            )}
          >
            {isWorkflow ? (
              <span className="text-primary text-xs font-bold">{i + 1}</span>
            ) : (
              <div className="bg-primary h-2 w-2 rounded-full" />
            )}
          </motion.div>
          <div className="pt-0.5">
            {item.year && renderBadge ? (
              renderBadge(item)
            ) : item.year ? (
              <span className="border-primary/20 bg-primary/5 text-primary inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium">
                {item.year}
              </span>
            ) : null}
            <h3 className={cn("font-semibold", isWorkflow ? "text-sm" : "mt-1.5")}>{item.title}</h3>
            {item.description && (
              <p className={cn("text-muted-foreground mt-1 text-sm", isWorkflow && "text-sm")}>
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
