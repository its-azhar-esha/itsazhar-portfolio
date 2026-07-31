"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  ImageIcon,
  Sparkles,
  FileText,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Services", href: "/admin/services", icon: Briefcase },
  { label: "Media", href: "/admin/media", icon: ImageIcon },
  { label: "AI", href: "/admin/ai", icon: Sparkles },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "SEO", href: "/admin/seo", icon: Search },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

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
      <div className="border-border/40 border-t p-3">
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
