"use client";

import { motion } from "framer-motion";

const dotVariants = {
  animate: (i: number) => ({
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      delay: i * 0.15,
      ease: "easeInOut" as const,
    },
  }),
};

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium">
        AI
      </div>
      <div className="bg-card flex items-center gap-1 rounded-2xl border px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="bg-muted-foreground h-1.5 w-1.5 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
