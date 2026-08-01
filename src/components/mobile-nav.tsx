"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  House,
  Briefcase,
  FolderKanban,
  User,
  LayoutGrid,
  Mail,
  FileText,
  Quote,
  Newspaper,
  Sparkles,
  X,
  CalendarCheck,
  Boxes,
  Workflow,
} from "lucide-react";
import { useChat } from "@/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { spring, springSoft } from "@/lib/motion";
import type { SiteSettings } from "@/types/settings";
import type { SharedMobileContent } from "@/lib/content/defaults/shared";

const tabs = [
  { label: "Home", href: "/", icon: House },
  { label: "Services", href: "/#services", icon: Briefcase },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "About", href: "/about", icon: User },
  { label: null, href: null, icon: LayoutGrid },
];

export function MobileNav({
  settings,
  content,
}: {
  settings: SiteSettings;
  content: SharedMobileContent;
}) {
  const pathname = usePathname();
  const { setIsOpen: setChatOpen } = useChat();
  const [moreOpen, setMoreOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href);

  const navEnabled = (href: string) =>
    settings.nav_order.some((item) => item.href === href) &&
    (settings.nav_order.find((item) => item.href === href)?.enabled ?? true);

  const moreItems = [
    { label: content.contact, href: "/contact", icon: Mail, visible: true },
    {
      label: content.caseStudies,
      href: "/#case-studies",
      icon: FileText,
      visible: settings.show_case_studies,
    },
    {
      label: content.testimonials,
      href: "/#testimonials",
      icon: Quote,
      visible: settings.show_testimonials,
    },
    {
      label: content.blog,
      href: "/blog",
      icon: Newspaper,
      visible: settings.show_blog && navEnabled("/blog"),
    },
    {
      label: content.hub,
      href: "/hub",
      icon: Boxes,
      visible: settings.show_hub && navEnabled("/hub"),
    },
    {
      label: content.playground,
      href: "/playground",
      icon: Workflow,
      visible: settings.show_playground && navEnabled("/playground"),
    },
  ].filter((item) => item.visible);

  const bookHref = settings.booking_url || "/contact";

  return (
    <>
      <nav
        className="fixed right-0 bottom-0 left-0 z-40 md:hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="border-border/50 bg-background/80 pb-safe shadow-primary/5 rounded-t-2xl border-t shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-around px-2 pt-1">
            {tabs.map((item) => {
              if (!item.href) {
                const Icon = item.icon;
                const moreActive = moreOpen;
                return (
                  <motion.button
                    key={item.label}
                    onClick={() => setMoreOpen(true)}
                    whileTap={{ scale: 0.92 }}
                    transition={spring}
                    aria-label="Open more options"
                    className="relative flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5"
                  >
                    <motion.div
                      animate={moreActive ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                      transition={springSoft}
                      className={cn(
                        "flex items-center justify-center rounded-lg p-1.5 transition-colors duration-200",
                        moreActive
                          ? "bg-primary/15 text-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <motion.span
                      animate={moreActive ? { y: -1 } : { y: 0 }}
                      transition={springSoft}
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-200",
                        moreActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {item.label ?? content.more}
                    </motion.span>
                  </motion.button>
                );
              }
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
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="more-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="border-border/50 bg-background pb-safe fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl border-t shadow-2xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="More options"
            >
              <div className="bg-muted-foreground/30 mx-auto mt-2 h-1 w-10 rounded-full" />
              <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <p className="text-sm font-semibold">{content.more}</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close more options"
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-3 pb-4">
                <div className="divide-border/40 divide-y">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors"
                      >
                        <Icon className="text-muted-foreground h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setChatOpen(true);
                    }}
                    className="hover:bg-accent/50 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors"
                  >
                    <Sparkles className="text-muted-foreground h-5 w-5" />
                    {content.aiAssistant}
                  </button>
                </div>

                <div className="border-border/50 mt-3 flex items-center justify-between rounded-lg border px-3 py-3">
                  <span className="text-sm font-medium">{content.theme}</span>
                  <ThemeToggle />
                </div>

                <Link href={bookHref} onClick={() => setMoreOpen(false)}>
                  <div className="from-primary to-primary/80 mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white shadow-lg">
                    <CalendarCheck className="h-4 w-4" />
                    {content.ctaLabel}
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
