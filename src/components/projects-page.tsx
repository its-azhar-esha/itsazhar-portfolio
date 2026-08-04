"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  FolderKanban,
  Play,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PROJECT_FILTER_GROUPS,
  OTHER_GROUP_LABEL,
  getFilterGroupForValue,
  projectMatchesGroup,
  isUngroupedProject,
  PUBLIC_PROJECT_STATUSES,
} from "@/constants/projects";
import { getProjects } from "@/lib/projects-data";
import dynamic from "next/dynamic";

const ProjectModal = dynamic(
  () => import("@/components/project-modal").then((m) => ({ default: m.ProjectModal })),
  {
    ssr: false,
  },
);
import type { Project } from "@/lib/projects-data";
import type { ProjectsPageContent } from "@/lib/content/defaults/projects";
import Link from "next/link";

const ALL_LABEL = "All" as const;

const statusColors: Record<string, string> = {
  "Production Ready": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "In Development": "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Prototype: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Completed: "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20",
};

interface FilterChipProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function FilterChip({ label, active, count, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary/50 bg-primary/15 text-foreground shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
          : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/40 hover:bg-accent/30 hover:text-foreground backdrop-blur-sm",
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn("ml-1.5 text-[11px]", count === 0 ? "opacity-40" : "opacity-60")}>
          ({count})
        </span>
      )}
    </button>
  );
}

export function ProjectsPage({ content }: { content: ProjectsPageContent }) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<string>(() => {
    if (typeof window === "undefined") return ALL_LABEL;
    const params = new URLSearchParams(window.location.search);
    const group = params.get("group");
    if (group) return group;
    const legacy = params.get("industry") ?? params.get("category");
    if (legacy) {
      const mapped = getFilterGroupForValue(legacy);
      if (mapped) return mapped.label;
    }
    return ALL_LABEL;
  });
  const [activeStatuses, setActiveStatuses] = React.useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [isMac] = React.useState(
    () => typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac"),
  );

  const statusLabelMap: Record<string, string> = {
    "Production Ready": content.statuses.production,
    "In Development": content.statuses.development,
    Prototype: content.statuses.prototype,
    Completed: content.statuses.completed,
  };

  React.useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const group = params.get("group");
      if (group) {
        setActiveGroup(group);
        return;
      }
      const legacy = params.get("industry") ?? params.get("category");
      if (legacy) {
        const mapped = getFilterGroupForValue(legacy);
        if (mapped) {
          setActiveGroup(mapped.label);
          return;
        }
      }
      setActiveGroup(ALL_LABEL);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const groupCounts = React.useMemo(() => {
    const counts: Record<string, number> = { [ALL_LABEL]: projects.length };
    for (const group of PROJECT_FILTER_GROUPS) counts[group.label] = 0;
    counts[OTHER_GROUP_LABEL] = 0;
    for (const p of projects) {
      const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
      let matched = false;
      for (const group of PROJECT_FILTER_GROUPS) {
        if (projectMatchesGroup(group, inds, p.category ?? "")) {
          counts[group.label] += 1;
          matched = true;
        }
      }
      if (!matched) counts[OTHER_GROUP_LABEL] += 1;
    }
    return counts;
  }, [projects]);

  const filterProjects = React.useCallback(
    (group: string, statuses: string[], featuredOnly: boolean, query: string): Project[] => {
      let result = projects;
      if (group !== ALL_LABEL) {
        result = result.filter((p) => {
          const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
          if (group === OTHER_GROUP_LABEL) {
            return isUngroupedProject(inds, p.category ?? "");
          }
          const groupDef = PROJECT_FILTER_GROUPS.find((g) => g.label === group);
          return !!groupDef && projectMatchesGroup(groupDef, inds, p.category ?? "");
        });
      }
      if (statuses.length > 0) {
        result = result.filter((p) => !!p.status && statuses.includes(p.status));
      }
      if (featuredOnly) {
        result = result.filter((p) => p.featured);
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
    },
    [projects],
  );

  const updateFilters = React.useCallback((group: string) => {
    setActiveGroup(group);
    const params = new URLSearchParams(window.location.search);
    if (group === ALL_LABEL) {
      params.delete("group");
    } else {
      params.set("group", group);
    }
    params.delete("industry");
    params.delete("category");
    const qs = params.toString();
    const url = qs ? `/projects?${qs}` : "/projects";
    window.history.replaceState(null, "", url);
  }, []);

  const updateGroup = React.useCallback(
    (group: string) => {
      if (group === activeGroup) return;
      updateFilters(group);
    },
    [activeGroup, updateFilters],
  );

  const toggleStatus = React.useCallback((status: string) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setSearchQuery("");
    setActiveStatuses([]);
    setFeaturedOnly(false);
    updateFilters(ALL_LABEL);
  }, [updateFilters]);

  const activeFilterCount =
    (activeGroup !== ALL_LABEL ? 1 : 0) + activeStatuses.length + (featuredOnly ? 1 : 0);

  const filtered = React.useMemo(
    () => filterProjects(activeGroup, activeStatuses, featuredOnly, searchQuery),
    [activeGroup, activeStatuses, featuredOnly, searchQuery, filterProjects],
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

  if (loading) {
    return (
      <div className="pt-24 md:pt-32">
        <section className="border-border/40 border-b py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="bg-muted mx-auto mb-4 h-6 w-32 animate-pulse rounded-full" />
              <div className="bg-muted mx-auto h-10 w-96 animate-pulse rounded-lg" />
              <div className="bg-muted mx-auto mt-6 h-6 w-128 animate-pulse rounded-lg" />
            </div>
          </div>
        </section>
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-64 animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

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
                {content.hero.badge}
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              {content.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground mt-6 text-lg"
            >
              {content.hero.intro}
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
                placeholder={content.searchPlaceholder}
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

            <div className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {content.filters.button}
                <ChevronDown
                  className={cn(
                    "text-muted-foreground h-3.5 w-3.5 transition-transform duration-200",
                    filtersOpen && "rotate-180",
                  )}
                />
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {activeGroup !== ALL_LABEL && (
                    <FilterChip label={activeGroup} active onClick={() => updateGroup(ALL_LABEL)} />
                  )}
                  {activeStatuses.map((status) => (
                    <FilterChip
                      key={status}
                      label={statusLabelMap[status] || status}
                      active
                      onClick={() => toggleStatus(status)}
                    />
                  ))}
                  {featuredOnly && (
                    <FilterChip
                      label={content.filters.featuredOnly}
                      active
                      onClick={() => setFeaturedOnly(false)}
                    />
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    {content.filters.clearAll}
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-border/60 bg-card/60 mx-auto max-w-3xl space-y-5 rounded-2xl border p-5 shadow-sm backdrop-blur-sm">
                    <div>
                      <p className="text-muted-foreground mb-2.5 text-xs font-medium tracking-wider uppercase">
                        {content.filters.groups}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <FilterChip
                          label={content.filters.all}
                          active={activeGroup === ALL_LABEL}
                          count={projects.length}
                          onClick={() => updateGroup(ALL_LABEL)}
                        />
                        {PROJECT_FILTER_GROUPS.map((group) => (
                          <FilterChip
                            key={group.label}
                            label={group.label}
                            active={activeGroup === group.label}
                            count={groupCounts[group.label] || 0}
                            onClick={() => updateGroup(group.label)}
                          />
                        ))}
                        <FilterChip
                          label={OTHER_GROUP_LABEL}
                          active={activeGroup === OTHER_GROUP_LABEL}
                          count={groupCounts[OTHER_GROUP_LABEL] || 0}
                          onClick={() => updateGroup(OTHER_GROUP_LABEL)}
                        />
                      </div>
                      <p className="text-muted-foreground/70 mt-2 text-xs">
                        Selecting a broad category includes all related industries and categories
                        (e.g. Healthcare & Wellness covers clinics, hospitals, healthtech,
                        pharmaceuticals and more).
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-2.5 text-xs font-medium tracking-wider uppercase">
                        {content.filters.status}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PUBLIC_PROJECT_STATUSES.map((status) => (
                          <FilterChip
                            key={status}
                            label={statusLabelMap[status] || status}
                            active={activeStatuses.includes(status)}
                            onClick={() => toggleStatus(status)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-border/40 flex items-center justify-between gap-4 border-t pt-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="featured-only"
                          checked={featuredOnly}
                          onCheckedChange={setFeaturedOnly}
                        />
                        <Label htmlFor="featured-only" className="text-sm">
                          {content.filters.featuredOnly}
                        </Label>
                      </div>
                      <button
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-destructive text-xs font-medium transition-colors"
                      >
                        {content.filters.clearAll}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && activeGroup !== ALL_LABEL && groupCounts[activeGroup] === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"
            >
              <p className="text-lg font-medium">{content.industryEmpty.comingSoon}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {content.industryEmpty.description.replace("{industry}", activeGroup)}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{content.industryEmpty.hint}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {content.industryEmpty.discussText}
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/contact">
                  <Button>{content.industryEmpty.discussLabel}</Button>
                </Link>
                <Button variant="outline" onClick={() => updateGroup(ALL_LABEL)}>
                  {content.industryEmpty.returnAll}
                </Button>
              </div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20 text-center"
            >
              <p className="text-lg font-medium">{content.searchEmpty.title}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {content.searchEmpty.description}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
                {content.searchEmpty.clearAll}
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
                          <div className="bg-muted relative aspect-video w-full overflow-hidden">
                            {project.coverImage ? (
                              <Image
                                src={project.coverImage}
                                alt={project.name}
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="from-primary/15 flex h-full w-full items-center justify-center bg-gradient-to-br to-teal-500/10">
                                <FolderKanban className="text-primary/60 h-10 w-10" />
                              </div>
                            )}
                          </div>
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
                                  {statusLabelMap[project.status] || project.status}
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
                                <Play className="h-3.5 w-3.5" /> {content.cards.demo}
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
                                {content.cards.details}
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
        detail={content.detail}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
