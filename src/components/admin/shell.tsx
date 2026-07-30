"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./sidebar";
import { AdminHeader } from "./header";
import { AdminMobileMenu } from "./mobile-menu";

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/projects/new")) return "New Project";
  if (pathname.match(/^\/admin\/projects\/[\w-]+\/edit$/)) return "Edit Project";
  if (pathname.startsWith("/admin/projects")) return "Projects";
  if (pathname.startsWith("/admin/media")) return "Media";
  if (pathname.startsWith("/admin/ai")) return "AI";
  if (pathname.startsWith("/admin/content/about")) return "About Page";
  if (pathname.startsWith("/admin/content/hero")) return "Hero Section";
  if (pathname.startsWith("/admin/content")) return "Content";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Dashboard";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const currentTitle = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <AdminMobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col md:ml-60">
        <AdminHeader title={currentTitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
