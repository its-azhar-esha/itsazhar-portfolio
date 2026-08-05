"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Play,
  X,
  Search,
  Layers,
  Cpu,
  Settings,
  ExternalLink,
  MessageCircle,
  Stethoscope,
  Landmark,
  Building2,
  Truck,
  Home,
  GraduationCap,
  ShoppingBag,
  Megaphone,
  Headphones,
  FileText,
  Mail,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { spring, springSoft, fadeIn } from "@/lib/motion";
import { getVideoSourceType } from "@/lib/media/utils";
import { useChat } from "@/providers";
import type { AboutContent } from "@/types/about";

export interface AboutStat {
  label: string;
  value: number;
}

interface AboutPageClientProps {
  content: AboutContent;
  stats: AboutStat[];
}

const lucideIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  Layers,
  Cpu,
  Settings,
  Stethoscope,
  Landmark,
  Building2,
  Truck,
  Home,
  GraduationCap,
  ShoppingBag,
  Megaphone,
  Headphones,
  FileText,
};

const socialIcons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  GitHub: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  Fiverr: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M23.004 15.584a6.676 6.676 0 01-4.849 2.14c-2.651 0-4.8-1.48-4.8-5.246V8.64h-2.62v-.983l2.62-1.092.375-3.86h1.765v3.76h4.412v2.175h-4.412v3.78c0 1.847.668 2.48 1.614 2.48a2.3 2.3 0 001.769-.563l.516 1.756a5.37 5.37 0 01-2.08.49M1.371 8.223h2.92v7.77H1.37V8.224zm4.508-3.273c0 .584-.428.99-1.02.99s-1.02-.406-1.02-.99c0-.56.428-.99 1.02-.99s1.02.43 1.02.99zM7.308 8.22v7.77H4.584v-7.77h2.724z" />
    </svg>
  ),
  Upwork: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.424 12.331c-.208 0-.405-.041-.588-.115l.023-.083.651-2.063c.131.028.267.043.405.043 1.358 0 2.463-1.107 2.463-2.47 0-1.36-1.105-2.466-2.463-2.466s-2.463 1.106-2.463 2.466c0 .537.172 1.036.465 1.442l-.664 2.099c-.802.319-1.392.951-1.689 1.738l-.421 1.33c-.435.181-.917.282-1.424.282-.238 0-.473-.023-.702-.066l1.01-3.194.003-.008.014-.044c.067-.212.101-.433.101-.66 0-1.36-1.105-2.466-2.463-2.466s-2.463 1.106-2.463 2.466c0 .678.274 1.291.718 1.737l-.98 3.102C6.043 17.302 5.111 18 3.09 18v-1.385c1.359 0 2.144-.545 2.637-1.782l.11-.285L7.784 9.12H9.43l-1.539 4.868.003.002c.145.095.279.209.396.34l.281-.889h1.044c.559 0 1.083-.15 1.535-.412l-.527 1.668c.241.077.497.119.763.119 1.358 0 2.463-1.107 2.463-2.466 0-.184-.02-.364-.059-.537l.478-1.516h1.644l-.36 1.141c-.21.666-.62 1.132-1.249 1.423l.291-.921c.188.223.469.36.781.36.555 0 1.007-.453 1.007-1.01 0-.556-.452-1.009-1.007-1.009z" />
    </svg>
  ),
  "X / Twitter": (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
};

const toolIconPaths: Record<string, string> = {
  n8n: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z",
  supabase:
    "M11.9 1.2c-.3-.3-.8-.2-1 .2L3.7 14.6c-.2.4.1.9.6.9h5.8l-2.2 7.3c-.2.6.4 1.2 1 1l13.2-8c.4-.2.4-.8 0-1l-5.6-4.5c-.2-.2-.3-.5-.2-.7l3.5-6.6c.2-.4-.1-.9-.6-.9H11.9z",
  docker:
    "M13.98 11.08h-2.26V8.86h2.26v2.22zm-3.14 0H8.58V8.86h2.26v2.22zm-3.14 0H5.44V8.86h2.26v2.22zm-3.14 0H2.3V8.86h2.26v2.22zm9.42-3.14h-2.26V5.72h2.26v2.22zm-3.14 0H8.58V5.72h2.26v2.22zm0 6.28c3.42 0 6.2-2.52 6.2-5.62 0-.3-.04-.6-.1-.9.8-.5 1.34-1.3 1.34-2.2 0-.72-.36-1.36-.9-1.8-.54-.44-1.26-.66-2.02-.56-.36-1.1-1.42-1.94-2.76-1.94-1.16 0-2.2.6-2.74 1.52-.3-.04-.6-.06-.92-.06-2.98 0-5.4 2.28-5.4 5.1v.1c0 2.94 2.52 5.34 5.6 5.34h5.7z",
  vercel: "M12 2L2 21h20L12 2zm0 4.5l7.5 13h-15L12 6.5z",
  react:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  nextjs:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l2 2V7zm-2 8l-2-2H7l4 4v-2z",
  tailwind:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  typescript:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  python:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  postgresql:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  stripe:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  figma:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  openai:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  claude:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
  github:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z",
};

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: (i * 137.5) % 100,
  y: (i * 97.3) % 100,
  size: (i % 3) + 1,
  duration: 15 + (i % 10),
  delay: (i * 1.7) % 10,
}));

function RotatingText({ roles }: { roles: string[] }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % roles.length), 3000);
    return () => clearInterval(id);
  }, [roles.length]);

  return (
    <div className="relative h-8 md:h-9" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p
          key={roles[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="text-primary absolute inset-0 flex items-center text-base font-medium md:text-lg"
        >
          {roles[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function IntroVideo({ videoUrl }: { videoUrl: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inlineVideoRef = React.useRef<HTMLVideoElement>(null);
  const overlayVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoaded(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleExpand = () => {
    inlineVideoRef.current?.pause();
    setPlaying(false);
    setExpanded(true);
  };

  const handleClose = () => {
    overlayVideoRef.current?.pause();
    setExpanded(false);
  };

  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const handleOverlayClick = () => {
    const video = inlineVideoRef.current;
    if (!video) return;
    if (playing) {
      handleExpand();
    } else {
      video.muted = false;
      void video.play();
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="border-border/60 from-primary/5 via-primary/[0.02] to-background relative aspect-video overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm backdrop-blur-sm"
      >
        {loaded ? (
          <video
            ref={inlineVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="h-full w-full object-cover"
            aria-label="Intro video"
          >
            <source src={videoUrl} type={getVideoSourceType(videoUrl)} />
          </video>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="bg-primary/10 h-8 w-8 animate-pulse rounded-full" />
          </div>
        )}
        <button
          onClick={handleOverlayClick}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/10 transition-all duration-300 hover:bg-black/20"
          aria-label={playing ? "Expand video with sound" : "Play intro video"}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-background/90 flex h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-110"
          >
            {playing ? (
              <ExternalLink className="text-foreground h-5 w-5" />
            ) : (
              <Play className="text-foreground ml-0.5 h-5 w-5" />
            )}
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-4xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground absolute -top-10 right-4 flex items-center gap-1.5 text-sm transition-colors"
              >
                <X className="h-4 w-4" /> Close
              </button>
              <div className="aspect-video overflow-hidden rounded-xl border bg-black shadow-2xl">
                <video
                  ref={overlayVideoRef}
                  controls
                  autoPlay
                  className="h-full w-full"
                  aria-label="Intro video expanded view"
                >
                  <source src={videoUrl} type={getVideoSourceType(videoUrl)} />
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [count, setCount] = React.useState(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <span className="text-3xl font-bold tracking-tight md:text-4xl">{count}</span>
      <span className="text-muted-foreground mt-1 block text-xs md:text-sm">{label}</span>
    </div>
  );
}

function ToolIcon({ name }: { name: string }) {
  const path = toolIconPaths[name.toLowerCase()];
  if (!path) return <div className="bg-primary/20 h-4 w-4 rounded" />;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function ToolChip({ name, icon }: { name: string; icon?: string }) {
  return (
    <div
      className="tool-chip border-border/50 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-primary/5 flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-[0_1px_3px_-1px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:shadow-md"
      tabIndex={0}
      role="listitem"
      aria-label={name}
    >
      <ToolIcon name={icon || name} />
      <span>{name}</span>
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`
      .marquee-row { overflow: hidden; }
      .marquee-track { display: flex; width: max-content; }
      .marquee-track.marquee-left { animation: marquee-left 30s linear infinite; }
      .marquee-track.marquee-right { animation: marquee-right 30s linear infinite; }
      .group\\/section:hover .marquee-track { animation-play-state: paused; }
      .tool-chip { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      .tool-chip:hover { transform: translateY(-3px) scale(1.03); }
      .tool-chip:hover svg { transform: rotate(2deg); }
      .tool-chip:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 2px; }
      @keyframes marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      @media (prefers-reduced-motion: reduce) {
        .marquee-track { animation: none !important; }
        .tool-chip { transition: none !important; }
        .tool-chip:hover { transform: none !important; }
        .tool-chip:hover svg { transform: none !important; }
      }
    `}</style>
  );
}

function LucideIcon({ name }: { name: string }) {
  const Icon = lucideIconMap[name];
  if (!Icon) return null;
  return <Icon className="h-5 w-5" />;
}

export function AboutPageClient({ content, stats }: AboutPageClientProps) {
  const { setIsOpen } = useChat();

  const {
    basic,
    biography,
    buildSteps,
    tools,
    industries,
    timeline,
    principles,
    socialLinks,
    resume,
  } = content;

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 relative overflow-hidden border-b py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="bg-primary/5 absolute -top-48 -right-48 h-96 w-96 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="bg-primary/5 absolute -bottom-48 -left-48 h-96 w-96 rounded-full blur-3xl"
          />
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="bg-primary/10 absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          ))}
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {basic.tagline}
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              {basic.tagline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground mt-6 text-lg leading-relaxed"
            >
              {biography.headline}
            </motion.p>
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-full md:w-[40%]"
            >
              <IntroVideo videoUrl={basic.introVideoUrl} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full md:w-[60%]"
            >
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Hi, I&apos;m {basic.name}
              </h2>
              <div className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed sm:text-base">
                {biography.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="text-foreground font-medium">
                  My mission: {biography.missionStatement}
                </p>
                <p className="text-foreground font-medium">
                  My vision: {biography.visionStatement}
                </p>
              </div>
              <div className="border-border/40 mt-6 border-t pt-6">
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Currently
                </p>
                <RotatingText roles={biography.roles} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/projects">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                  >
                    <Button className="group shadow-primary/10 gap-2 shadow-sm">
                      View My Projects{" "}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/contact">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                  >
                    <Button variant="outline" className="group gap-2">
                      Book Free Audit
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              How I Build Automation Systems
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              A proven process from discovery to deployment.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {buildSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                className="group"
              >
                <Card className="border-border/60 bg-card/60 hover:border-primary/30 hover:shadow-primary/5 h-full backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
                      <LucideIcon name={step.icon} />
                    </div>
                    <h3 className="mt-4 font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="group/section border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Tools I Use
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              A constantly evolving toolkit for building AI systems, business automations, and
              modern web applications.
            </p>
          </motion.div>
        </div>
        <div className="relative mt-14 overflow-hidden">
          <StyleTag />
          {[0, 1].map((row) => {
            const half = Math.ceil(tools.length / 2);
            const items = row === 0 ? tools.slice(0, half) : tools.slice(half);
            const duplicated = [...items, ...items];
            const dir = row === 0 ? "marquee-left" : "marquee-right";
            return (
              <div key={row} className="marquee-row mb-5 last:mb-0">
                <div className={`marquee-track flex gap-4 md:gap-5 ${dir}`} aria-hidden="true">
                  {duplicated.map((tool, i) => (
                    <ToolChip key={`${tool.name}-${i}`} name={tool.name} icon={tool.icon} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Industries I Build For
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              Every industry can benefit from intelligent automation.
            </p>
          </motion.div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {industries.map((ind, i) => {
              const IndustryIcon = lucideIconMap[ind];
              return (
                <motion.div
                  key={ind}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <div className="border-border/50 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-sm transition-all duration-200">
                    {IndustryIcon ? <IndustryIcon className="h-3.5 w-3.5" /> : null}
                    {ind}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              My Journey
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              From first workflow to enterprise solutions.
            </p>
          </motion.div>
          <div className="mx-auto mt-12 max-w-2xl">
            {timeline.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
                className="relative flex gap-5 pb-10 last:pb-0"
              >
                {i < timeline.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
                    className="bg-border absolute top-8 bottom-0 left-[13px] w-px origin-top"
                  />
                )}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.12 + 0.1,
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  className="border-primary bg-background flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
                >
                  <div className="bg-primary h-2 w-2 rounded-full" />
                </motion.div>
                <div className="pt-0.5">
                  <span className="border-primary/20 bg-primary/5 text-primary inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium">
                    {item.year}
                  </span>
                  <h3 className="mt-1.5 font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              My Approach
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              The principles that guide every system I build.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {principles.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 25 } }}
              >
                <Card className="border-border/60 bg-card/50 hover:border-primary/30 hover:shadow-primary/5 h-full backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                      <Quote className="text-primary h-4 w-4" />
                    </div>
                    <h3 className="mt-4 font-semibold">{v.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {v.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              By the Numbers
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              Real metrics from real projects.
            </p>
          </motion.div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {stats.map((s) => (
              <AnimatedCounter key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Find Me On
            </h2>
            <p className="text-muted-foreground mt-3 text-center">
              Connect with me across platforms.
            </p>
          </motion.div>
          <div className="mx-auto mt-10 grid max-w-lg gap-3">
            {socialLinks.map((s, i) => {
              const isMailto = s.url.startsWith("mailto:");
              return (
                <motion.a
                  key={s.name}
                  href={s.placeholder ? undefined : s.url}
                  target={s.placeholder || isMailto ? undefined : "_blank"}
                  rel={s.placeholder || isMailto ? undefined : "noopener noreferrer"}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  whileHover={{
                    x: 6,
                    y: -2,
                    borderColor: "hsl(var(--primary) / 0.3)",
                    boxShadow: "0 4px 20px -8px hsl(var(--primary)/0.15)",
                    transition: springSoft,
                  }}
                  whileTap={{ scale: 0.98, transition: springSoft }}
                  className={`group border-border/60 bg-card/60 hover:border-primary/40 hover:shadow-primary/10 flex items-center gap-3 rounded-lg border px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:shadow-md ${s.placeholder ? "cursor-default opacity-70" : ""}`}
                  aria-label={s.placeholder ? `${s.name} (coming soon)` : `${s.name} profile`}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                  >
                    {s.name === "Email" ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      socialIcons[s.name] || <ExternalLink className="h-4 w-4" />
                    )}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {s.username}
                      {s.placeholder ? " (Coming Soon)" : ""}
                    </p>
                  </div>
                  {!s.placeholder && (
                    <ExternalLink className="text-muted-foreground group-hover:text-primary h-3.5 w-3.5 shrink-0 transition-all duration-200 group-hover:translate-x-[3px] group-hover:-translate-y-[2px]" />
                  )}
                </motion.a>
              );
            })}
          </div>
          {resume?.url ? (
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link
                  href={resume.url}
                  target={resume.url.startsWith("http") ? "_blank" : undefined}
                  rel={resume.url.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <FileText className="h-4 w-4" />
                  {resume.label || "Download Resume"}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-xl text-center"
          >
            <div className="border-border/60 bg-card/60 rounded-xl border p-8 backdrop-blur-sm md:p-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mt-3 text-sm">
                Ask Azhar AI — the AI assistant trained on everything I build. Get instant answers
                about my work, process, and experience.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
                className="mt-8 inline-block"
              >
                <Button
                  size="lg"
                  onClick={() => setIsOpen(true)}
                  className="group shadow-primary/10 gap-2 shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask Azhar AI
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
