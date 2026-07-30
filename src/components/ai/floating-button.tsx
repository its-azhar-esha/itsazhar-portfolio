"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface FloatingButtonProps {
  onClick: () => void
}

export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2, borderColor: "hsl(var(--primary)/0.4)" }}
      whileTap={{ scale: 0.95 }}
      className="group fixed bottom-24 right-4 z-50 hidden items-center gap-2.5 rounded-full border border-primary/20 bg-background/80 px-5 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-200 hover:border-primary/40 hover:bg-background hover:shadow-lg hover:shadow-primary/5 md:flex lg:bottom-6"
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
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

      <motion.span
        className="absolute -top-1 -right-1 flex h-3 w-3"
        aria-label="Online"
      >
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
  )
}
