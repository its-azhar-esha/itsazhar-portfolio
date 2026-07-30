"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="border-border bg-background h-9 w-9 rounded-full border" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative h-9 w-9 overflow-hidden rounded-full border transition-all duration-300",
        "hover:border-foreground/30 hover:shadow-lg",
        isDark
          ? "border-zinc-700 bg-zinc-900 hover:shadow-yellow-500/10"
          : "border-zinc-300 bg-zinc-100 hover:shadow-blue-500/10",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(234,179,8,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
        }}
        transition={{ duration: 0.4 }}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
          transition={{
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="flex h-full w-full items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-400 transition-colors group-hover:text-yellow-300" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600 transition-colors group-hover:text-blue-500" />
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        whileHover={{ scale: 1.3, opacity: 0.15 }}
        transition={{ duration: 0.3 }}
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(234,179,8,0.3) 0%, transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.3) 0%, transparent 70%)",
          opacity: 0,
        }}
      />
    </button>
  );
});
