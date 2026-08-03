"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  BookOpen,
  MessageSquareQuote,
  ImageIcon,
  Sparkles,
  FileText,
  Search,
  Settings,
  Users,
  LogOut,
  Newspaper,
  Boxes,
  Workflow,
  BarChart3,
  Activity,
  History,
  KeyRound,
  ShieldCheck,
  HeartPulse,
  BellRing,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
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
    {
      label: "Blog",
      href: "/admin/blog",
      icon: Newspaper,
      enabled: settings.show_blog,
    },
    {
      label: "Hub",
      href: "/admin/hub",
      icon: Boxes,
      enabled: settings.show_hub,
    },
    {
      label: "Playground",
      href: "/admin/playground",
      icon: Workflow,
      enabled: settings.show_playground,
    },
    { label: "Media", href: "/admin/media", icon: ImageIcon },
    { label: "Storage & Cleanup", href: "/admin/storage", icon: HardDrive },
    {
      label: "AI",
      href: "/admin/ai",
      icon: Sparkles,
      enabled: settings.show_ai_chat,
    },
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
    { label: "Notifications", href: "/admin/notifications", icon: BellRing },
    { label: "Keep-Alive", href: "/admin/keepalive", icon: HeartPulse },
    { label: "Security", href: "/admin/security", icon: ShieldCheck },
    { label: "Developer Tools", href: "/admin/dx", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];
}

interface AdminSidebarProps {
  settings: SiteSettings;
}

export function AdminSidebar({ settings }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(settings);

  return (
    <aside className="border-border/40 bg-background fixed top-0 left-0 z-30 hidden h-full w-60 flex-col border-r md:flex">
      <Link href="/admin" className="border-border/40 flex h-14 items-center gap-2.5 border-b px-5">
        <div className="bg-primary shadow-primary/20 flex h-7 w-7 items-center justify-center rounded-lg shadow-sm">
          <span className="text-primary-foreground text-xs font-bold">A</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">Admin</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.enabled === false && (
                    <span
                      className="text-muted-foreground/70 ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase"
                      title="This section is turned off in Settings"
                    >
                      Off
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      transition={spring}
                      className="bg-accent absolute inset-0 rounded-lg"
                      style={{ zIndex: -1 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
