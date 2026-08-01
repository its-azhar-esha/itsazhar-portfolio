"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { spring, durationFast } from "@/lib/motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItemConfig } from "@/types/settings";
import type { SharedNavContent } from "@/lib/content/defaults/shared";

interface NavbarProps {
  logoUrl?: string | null;
  bookingUrl?: string | null;
  showBlog?: boolean;
  showHub?: boolean;
  showPlayground?: boolean;
  navOrder?: NavItemConfig[] | null;
  nav: SharedNavContent;
  brandName: string;
}

export function Navbar({
  logoUrl,
  bookingUrl,
  showBlog,
  showHub,
  showPlayground,
  navOrder,
  nav,
  brandName,
}: NavbarProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const bookHref = bookingUrl || "/contact";

  const moduleEnabled: Record<string, boolean> = {
    "/blog": showBlog !== false,
    "/hub": showHub !== false,
    "/playground": showPlayground !== false,
  };

  let links: { label: string; href: string }[];
  if (navOrder && navOrder.length > 0) {
    links = navOrder
      .filter((item) => item.enabled && (moduleEnabled[item.href] ?? true))
      .map((item) => ({ label: item.label, href: item.href }));
    if (links.length === 0) {
      links = nav.fallbackLinks.filter((link) => moduleEnabled[link.href] ?? true);
    }
  } else {
    links = nav.fallbackLinks.filter((link) => moduleEnabled[link.href] ?? true);
  }

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
        scrolled ? "border-border/40 bg-background/80 border-b backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Home" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="bg-primary group-hover:shadow-primary/20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg transition-shadow duration-200 group-hover:shadow-md"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-primary-foreground text-sm font-bold">A</span>
            )}
          </motion.div>
          <span className="text-lg font-semibold tracking-tight">{brandName}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href.replace("/#", "/"));
            return (
              <motion.div
                key={link.label}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative"
              >
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm transition-colors duration-200",
                    isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  <motion.span
                    initial={{ scaleX: isActive ? 1 : 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: durationFast, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      "bg-primary absolute right-3 bottom-0 left-3 h-0.5 origin-left rounded-full",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}
                  />
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <Link href={bookHref} data-track="cta_click" data-track-label="Navbar: Book audit">
              <Button
                size="sm"
                className="group gap-1.5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                {nav.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
