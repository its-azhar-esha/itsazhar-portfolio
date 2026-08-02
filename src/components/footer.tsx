"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe, Mail, ExternalLink, Camera, Video, FolderGit, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { spring } from "@/lib/motion";
import Link from "next/link";
import type { SiteSettings } from "@/types/settings";
import type { SharedFooterContent } from "@/lib/content/defaults/shared";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface FooterProps {
  settings: SiteSettings;
  logoUrl?: string | null;
  content: SharedFooterContent;
}

export function Footer({ settings, logoUrl, content }: FooterProps) {
  const bookHref = settings.booking_url || "/contact";
  const socialLinks = [
    settings.social_linkedin && {
      label: "LinkedIn",
      href: settings.social_linkedin,
      icon: Globe,
    },
    settings.social_fiverr && {
      label: "Fiverr",
      href: settings.social_fiverr,
      icon: ExternalLink,
    },
    settings.social_instagram && {
      label: "Instagram",
      href: settings.social_instagram,
      icon: Camera,
    },
    settings.social_youtube && {
      label: "YouTube",
      href: settings.social_youtube,
      icon: Video,
    },
    settings.social_github && {
      label: "GitHub",
      href: settings.social_github,
      icon: FolderGit,
    },
    settings.social_twitter && {
      label: "X / Twitter",
      href: settings.social_twitter,
      icon: X,
    },
    settings.contact_email && {
      label: "Email",
      href: `mailto:${settings.contact_email}`,
      icon: Mail,
    },
  ].filter((link): link is { label: string; href: string; icon: typeof Globe } => Boolean(link));
  let links = settings.show_blog
    ? [...quickLinks, { label: content.blogLabel, href: "/blog" }]
    : quickLinks;
  links = settings.show_hub ? [...links, { label: content.hubLabel, href: "/hub" }] : links;
  links = settings.show_playground
    ? [...links, { label: content.playgroundLabel, href: "/playground" }]
    : links;

  return (
    <footer className="border-border/40 border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Home" className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground text-sm font-bold">
                    {settings.site_name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-lg font-semibold tracking-tight">{settings.site_name}</span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              {content.intro}
            </p>
            <p className="text-muted-foreground mt-3 text-xs">{settings.tagline}</p>
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
            <h3 className="text-sm font-semibold">{content.quickLinksTitle}</h3>
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
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
            <h3 className="text-sm font-semibold">{content.ctaTitle}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{content.ctaDescription}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <Link href={bookHref}>
                  <Button size="sm" className="group gap-1.5">
                    {content.primaryButton}
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
                    {content.secondaryButton}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-xs">{settings.footer_text}</p>
        </div>
      </div>
    </footer>
  );
}
