"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { spring, durationFast } from "@/lib/motion"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
]

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-shadow duration-200 group-hover:shadow-md group-hover:shadow-primary/20"
          >
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </motion.div>
          <span className="text-lg font-semibold tracking-tight">
            Azhar
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(link.href.replace("/#", "/"))
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
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  <motion.span
                    initial={{ scaleX: isActive ? 1 : 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: durationFast, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      "absolute bottom-0 left-3 right-3 h-0.5 origin-left rounded-full bg-primary",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <Link href="/contact">
              <Button size="sm" className="group gap-1.5 shadow-sm transition-shadow duration-200 hover:shadow-md">
                Book a Free 15-Min Audit
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
