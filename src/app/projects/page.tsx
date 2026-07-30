"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projects } from "@/lib/projects";
import dynamic from "next/dynamic";

const ProjectModal = dynamic(
  () => import("@/components/project-modal").then((m) => ({ default: m.ProjectModal })),
  {
    ssr: false,
  },
);
import type { Project } from "@/lib/projects";
import Link from "next/link";

const INDUSTRIES = [
  "All",
  "Healthcare",
  "Finance & FinTech",
  "Business Operations",
  "Logistics",
  "E-Commerce",
  "Real Estate",
  "Education",
  "Manufacturing",
  "Human Resources",
  "Sales & CRM",
  "Marketing",
  "Customer Support",
  "Legal",
  "Insurance",
  "Hospitality",
  "Travel",
  "Construction",
  "Non-Profit",
  "Government",
  "Document Intelligence",
  "Custom Solutions",
];

const statusColors: Record<string, string> = {
  "Production Ready": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "In Development": "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Prototype: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Completed: "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20",
};

function getIndustryCounts() {
  const counts: Record<string, number> = { All: projects.length };
  for (const p of projects) {
    const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
    for (const ind of inds) {
      counts[ind] = (counts[ind] || 0) + 1;
    }
  }
  for (const ind of INDUSTRIES) {
    if (!(ind in counts)) counts[ind] = 0;
  }
  return counts;
}

function filterProjects(industry: string, query: string): Project[] {
  let result = projects;
  if (industry !== "All") {
    result = result.filter((p) => {
      const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
      return inds.includes(industry);
    });
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.tech?.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return result;
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeIndustry, setActiveIndustry] = React.useState(() => {
    if (typeof window === "undefined") return "All";
    const params = new URLSearchParams(window.location.search);
    const ind = params.get("industry");
    if (ind && INDUSTRIES.includes(ind)) return ind;
    return "All";
  });
  const searchRef = React.useRef<HTMLInputElement>(null);
  const filterRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [isMac] = React.useState(
    () => typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac"),
  );

  React.useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const ind = params.get("industry");
      setActiveIndustry(ind && INDUSTRIES.includes(ind) ? ind : "All");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const updateIndustry = React.useCallback(
    (industry: string) => {
      if (industry === activeIndustry) return;
      setActiveIndustry(industry);
      const params = new URLSearchParams(window.location.search);
      if (industry === "All") {
        params.delete("industry");
      } else {
        params.set("industry", industry);
      }
      const qs = params.toString();
      const url = qs ? `/projects?${qs}` : "/projects";
      window.history.replaceState(null, "", url);
    },
    [activeIndustry],
  );

  const industryCounts = React.useMemo(() => getIndustryCounts(), []);

  const filtered = React.useMemo(
    () => filterProjects(activeIndustry, searchQuery),
    [activeIndustry, searchQuery],
  );

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current?.focus();
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onFilterKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = -1;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % INDUSTRIES.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + INDUSTRIES.length) % INDUSTRIES.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = INDUSTRIES.length - 1;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      updateIndustry(INDUSTRIES[index]);
      return;
    }
    if (newIndex >= 0) {
      e.preventDefault();
      filterRefs.current[newIndex]?.focus();
    }
  };

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                Real Projects Built with AI + Automation
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              Featured Systems & Automation Projects
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground mt-6 text-lg"
            >
              Explore production-ready AI systems, workflow automations, and business solutions
              designed to eliminate repetitive work and improve operational efficiency.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-4">
            <div className="relative mx-auto max-w-md">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 h-10 w-full rounded-xl border pr-10 pl-10 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="bg-muted text-muted-foreground/60 pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] sm:inline">
                  {isMac ? "⌘" : "Ctrl+"}K
                </kbd>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Filter by industry"
              className="flex flex-wrap justify-center gap-2"
            >
              {INDUSTRIES.map((ind, i) => {
                const count = industryCounts[ind];
                const isActive = activeIndustry === ind;
                return (
                  <button
                    key={ind}
                    ref={(el) => {
                      filterRefs.current[i] = el;
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${ind} (${count} project${count === 1 ? "" : "s"})`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => updateIndustry(ind)}
                    onKeyDown={(e) => onFilterKeyDown(e, i)}
                    className={`relative rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "border-primary/50 bg-primary/15 text-foreground shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/40 hover:bg-accent/30 hover:text-foreground backdrop-blur-sm"
                    }`}
                  >
                    <span>{ind}</span>
                    <span className="ml-1.5 text-[11px] opacity-60">({count})</span>
                    {isActive && (
                      <motion.span
                        layoutId="active-indicator"
                        className="bg-primary absolute right-2 -bottom-px left-2 h-0.5 rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 &&
          activeIndustry !== "All" &&
          industryCounts[activeIndustry] === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"
            >
              <p className="text-lg font-medium">Coming Soon</p>
              <p className="text-muted-foreground mt-2 text-sm">
                No projects available for{" "}
                <span className="text-foreground font-medium">{activeIndustry}</span> yet.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                I am actively building automation systems for this sector.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Want something custom? Let&apos;s discuss your workflow.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/contact">
                  <Button>Let&apos;s Discuss</Button>
                </Link>
                <Button variant="outline" onClick={() => updateIndustry("All")}>
                  Return to All
                </Button>
              </div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <p className="text-lg font-medium">No matching projects found</p>
              <p className="text-muted-foreground mt-2 text-sm">Try another keyword or filter.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  updateIndustry("All");
                }}
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((project) => (
                  <motion.div
                    key={project.slug}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="group block w-full text-left"
                    >
                      <motion.div
                        whileHover={{
                          y: -4,
                          boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08)",
                          transition: { type: "spring", stiffness: 300, damping: 25 },
                        }}
                        whileTap={{
                          scale: 0.99,
                          transition: { type: "spring", stiffness: 400, damping: 20 },
                        }}
                      >
                        <Card className="hover:border-primary/30 hover:shadow-primary/5 h-full cursor-pointer transition-all duration-300 hover:shadow-lg">
                          <CardHeader>
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="w-fit">
                                {project.category}
                              </Badge>
                              {project.status && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[project.status] || "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20"}`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  {project.status}
                                </span>
                              )}
                            </div>
                            <CardTitle className="group-hover:text-primary text-lg transition-colors">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-2 text-sm leading-relaxed">
                              {project.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1.5">
                              {(project.tech || project.tags).slice(0, 4).map((t) => (
                                <Badge
                                  key={t}
                                  variant="outline"
                                  className="hover:border-primary/40 hover:bg-primary/5 text-xs transition-all duration-200"
                                >
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="gap-3">
                            {project.hasVideo && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject(project);
                                }}
                              >
                                <Play className="h-3.5 w-3.5" /> Demo
                              </Button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                              }}
                              className="group/btn text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
                            >
                              <span className="relative">
                                View Details
                                <span className="bg-foreground absolute -bottom-0.5 left-0 h-px w-0 rounded-full transition-all duration-200 group-hover/btn:w-full" />
                              </span>
                              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-[3px]" />
                            </button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <ProjectModal
        project={selectedProject}
        projects={projects}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
