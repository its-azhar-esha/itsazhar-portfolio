"use client";

import { Menu, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="border-border/40 bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-4 border-b px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenuClick}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground -ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2">
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="from-foreground via-primary to-foreground bg-gradient-to-r bg-[length:200%_auto] bg-clip-text text-base font-bold tracking-tight text-transparent"
          style={{ animation: "gradient-slide 6s ease-in-out infinite" }}
        >
          Admin Panel — itsazhar
        </motion.h1>
        <style jsx>{`
          @keyframes gradient-slide {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      </div>
      <div className="ml-auto">
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
