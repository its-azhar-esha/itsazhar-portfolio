"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  BookOpen,
  MessageSquareQuote,
  ImageIcon,
  Sparkles,
  FileText,
  Search,
  Settings,
  LogOut,
  BarChart3,
  Activity,
  History,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import type { SiteSettings } from "@/types/settings";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
}

function buildNavItems(settings: SiteSettings): NavItem[] {
  return [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Leads", href: "/admin/leads", icon: Users },
    {
      label: "Projects",
      href: "/admin/projects",
      icon: FolderKanban,
      enabled: settings.show_showcase,
    },
    {
      label: "Services",
      href: "/admin/services",
      icon: Briefcase,
      enabled: settings.show_services,
    },
    {
      label: "Case Studies",
      href: "/admin/case-studies",
      icon: BookOpen,
      enabled: settings.show_case_studies,
    },
    {
      label: "Testimonials",
      href: "/admin/testimonials",
      icon: MessageSquareQuote,
      enabled: settings.show_testimonials,
    },
    { label: "Media", href: "/admin/media", icon: ImageIcon },
    { label: "AI", href: "/admin/ai", icon: Sparkles, enabled: settings.show_ai_chat },
    {
      label: "Content",
      href: "/admin/content",
      icon: FileText,
      enabled: settings.show_hero || settings.show_about,
    },
    { label: "SEO", href: "/admin/seo", icon: Search },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Activity", href: "/admin/activity", icon: History },
    { label: "Integrations", href: "/admin/integrations", icon: KeyRound },
    { label: "Security", href: "/admin/security", icon: ShieldCheck },
    { label: "Developer Tools", href: "/admin/dx", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];
}

interface AdminMobileMenuProps {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
}

export function AdminMobileMenu({ open, onClose, settings }: AdminMobileMenuProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(settings);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="border-border/40 bg-background fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r md:hidden"
          >
            <div className="border-border/40 flex h-14 items-center justify-between border-b px-4">
              <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
                <div className="bg-primary shadow-primary/20 flex h-7 w-7 items-center justify-center rounded-lg shadow-sm">
                  <span className="text-primary-foreground text-xs font-bold">A</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">Admin</span>
              </Link>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {item.enabled === false && (
                        <span className="text-muted-foreground/70 ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                          Off
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-border/40 space-y-1 border-t p-3">
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-muted-foreground hover:bg-destructive/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
              <Link
                href="/"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
              >
                ← Back to site
              </Link>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
