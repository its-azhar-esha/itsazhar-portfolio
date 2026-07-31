"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminSidebar } from "./sidebar";
import { AdminHeader } from "./header";
import { AdminMobileMenu } from "./mobile-menu";
import { ToastProvider } from "@/components/ui/toast";
import type { SiteSettings } from "@/types/settings";

export function AdminShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const showBack = pathname !== "/admin";

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin");
    }
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <AdminSidebar settings={settings} />
        <AdminMobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          settings={settings}
        />
        <div className="flex flex-1 flex-col md:ml-60">
          <AdminHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1">
            {showBack && (
              <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
                <button
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
