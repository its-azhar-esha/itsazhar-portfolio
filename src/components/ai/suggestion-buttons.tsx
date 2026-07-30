"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SuggestionButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading: boolean;
}

export function SuggestionButtons({ suggestions, onSelect, isLoading }: SuggestionButtonsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-wrap gap-2 px-4 py-2"
    >
      {suggestions.map((suggestion, i) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ scale: 1.04, borderColor: "hsl(var(--primary)/0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          disabled={isLoading}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition-all duration-200",
            "border-border text-muted-foreground",
            "hover:border-primary/40 hover:text-foreground hover:bg-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}
