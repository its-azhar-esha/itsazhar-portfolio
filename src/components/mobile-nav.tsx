"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { House, FolderKanban, User, Mail, Sparkles } from "lucide-react";
import { useChat } from "@/providers";
import { spring, springSoft } from "@/lib/motion";

const navItems = [
  { label: "Home", href: "/", icon: House },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "About", href: "/about", icon: User },
  { label: "Contact", href: "/contact", icon: Mail },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setIsOpen } = useChat();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="border-border/50 bg-background/80 pb-safe shadow-primary/5 rounded-t-2xl border-t shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-around px-2 pt-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5"
              >
                <motion.div
                  animate={active ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                  transition={springSoft}
                  className={cn(
                    "flex items-center justify-center rounded-lg p-1.5 transition-colors duration-200",
                    active
                      ? "bg-primary/15 text-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <motion.span
                  animate={active ? { y: -1 } : { y: 0 }}
                  transition={springSoft}
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}

          <motion.button
            onClick={() => setIsOpen(true)}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            aria-label="Open AI chat assistant"
            className="relative flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="from-primary/15 to-primary/5 text-primary flex items-center justify-center rounded-lg bg-gradient-to-br p-1.5 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]"
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <motion.span
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-primary text-[10px] font-medium"
            >
              AI
            </motion.span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
