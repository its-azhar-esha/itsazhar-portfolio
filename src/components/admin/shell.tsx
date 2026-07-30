"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./sidebar";
import { AdminHeader } from "./header";
import { AdminMobileMenu } from "./mobile-menu";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/projects": "Projects",
  "/admin/media": "Media",
  "/admin/ai": "AI",
  "/admin/content": "Content",
  "/admin/settings": "Settings",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  let currentTitle = "Dashboard";
  for (const [path, label] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path.length > 0) {
      currentTitle = label;
    }
  }

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
