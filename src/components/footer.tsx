"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { spring } from "@/lib/motion";
import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/azharmahmudalif",
    icon: Globe,
  },
  {
    label: "Fiverr",
    href: "https://fiverr.com/azhar_m_alif",
    icon: ExternalLink,
  },
  {
    label: "Email",
    href: "mailto:azharmahmudalif@gmail.com",
    icon: Mail,
  },
];

export function Footer() {
  return (
    <footer className="border-border/40 border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Home" className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">A</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">Azhar</span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              I build AI automation systems that eliminate repetitive work, connect business tools,
              and help teams operate smarter through AI agents, workflows, and intelligent
              integrations.
            </p>
            <p className="text-muted-foreground mt-3 text-xs">AI Automation Specialist</p>
            <div className="mt-4 flex items-center gap-2">
              {socialLinks.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                    >
                      <link.icon className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group/link text-muted-foreground hover:text-foreground relative inline-block text-sm transition-colors duration-200"
                  >
                    {link.label}
                    <span className="bg-foreground absolute -bottom-0.5 left-0 h-px w-0 rounded-full transition-all duration-200 group-hover/link:w-full" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold">Stop wasting time. Start automating.</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Book a free 15-minute audit and discover what automation can do for your business.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <Link href="/contact">
                  <Button size="sm" className="group gap-1.5">
                    Book Free Audit
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    View Projects
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; 2026 Azhar (itsazhar.com). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
