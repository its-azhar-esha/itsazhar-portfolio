"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface FloatingButtonProps {
  onClick: () => void;
}

export const FloatingButton = React.memo(function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2, borderColor: "hsl(var(--primary)/0.4)" }}
      whileTap={{ scale: 0.95 }}
      aria-label="Open AI chat assistant"
      className="group border-primary/20 bg-background/80 hover:border-primary/40 hover:bg-background hover:shadow-primary/5 fixed right-4 bottom-24 z-50 hidden items-center gap-2.5 rounded-full border px-5 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-200 hover:shadow-lg md:flex lg:bottom-6"
    >
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="bg-primary/10 group-hover:bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
          <Sparkles className="text-primary h-4 w-4" />
        </div>
        <motion.div
          className="bg-primary/20 absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <span className="text-sm font-medium">Ask Azhar AI</span>

      <motion.span className="absolute -top-1 -right-1 flex h-3 w-3" aria-hidden="true">
        <motion.span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </motion.span>
    </motion.button>
  );
});
