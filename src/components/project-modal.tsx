"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, ArrowRight, FolderKanban } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modalOverlay, spring } from "@/lib/motion";
import type { Project } from "@/lib/projects-data";
import type { ProjectsDetailContent } from "@/lib/content/defaults/projects";
import Link from "next/link";

interface ProjectModalProps {
  project: Project | null;
  projects: Project[];
  detail: ProjectsDetailContent;
  onClose: () => void;
}

/* Deterministic, seed-based shuffle so recommendations are stable for a
   given project (React purity: no Math.random during render). */
function seededPick<T>(items: T[], seed: string, count: number): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, count);
}

function WorkflowTimeline({ steps }: { steps: string[] }) {
  return (
    <div className="relative">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="relative flex gap-4 pb-8 last:pb-0"
        >
          {i < steps.length - 1 && (
            <div className="bg-border absolute top-5 left-[11px] h-full w-px" />
          )}
          <div className="border-primary bg-background relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.15, type: "spring", stiffness: 400, damping: 20 }}
              className="bg-primary h-2 w-2 rounded-full"
            />
          </div>
          <div className="pt-0.5">
            <p className="text-muted-foreground text-sm">{step}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ProjectModal({ project, projects, detail, onClose }: ProjectModalProps) {
  const router = useRouter();
  const related = React.useMemo(() => {
    if (!project) return [];
    const others = projects.filter((p) => p.slug !== project.slug);
    const industry = Array.isArray(project.industry) ? project.industry : [project.industry];
    const byIndustry = others.filter((p) => {
      const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
      return inds.some((i) => industry.includes(i));
    });
    if (byIndustry.length >= 3) return byIndustry.slice(0, 3);
    const chosen = new Set(byIndustry.map((p) => p.slug));
    const rest = seededPick(
      others.filter((p) => !chosen.has(p.slug)),
      project.slug,
      3 - byIndustry.length,
    );
    return [...byIndustry, ...rest];
  }, [project, projects]);

  const openProject = (slug: string) => {
    onClose();
    router.push(`/projects/${slug}`);
  };

  React.useEffect(() => {
    if (!project) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={project.name}
          className="bg-background/60 fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm md:items-center"
          onClick={onClose}
        >
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
            className="bg-card relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border shadow-2xl md:max-w-2xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary)/0.3)" }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                autoFocus
                className="bg-background text-muted-foreground hover:text-foreground absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <div className="mb-6 flex items-center justify-between gap-2">
                <Badge variant="secondary" className="w-fit">
                  {project.category}
                </Badge>
                {project.status && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {project.status}
                  </span>
                )}
              </div>

              <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl">
                {project.coverImage ? (
                  <Image
                    src={project.coverImage}
                    alt={project.name}
                    fill
                    sizes="(min-width: 768px) 672px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="from-primary/15 flex h-full w-full items-center justify-center bg-gradient-to-br to-teal-500/10">
                    <FolderKanban className="text-primary/60 h-10 w-10" />
                  </div>
                )}
              </div>

              {project.gallery && project.gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {project.gallery.map((src, i) => (
                    <div
                      key={i}
                      className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl"
                    >
                      <Image
                        src={src}
                        alt={`${project.name} screenshot ${i + 1}`}
                        fill
                        sizes="(min-width: 768px) 320px, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {project.longDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="hover:border-primary/50 hover:bg-primary/10 hover:text-foreground transition-all duration-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {project.hasVideo && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                  >
                    <Button className="gap-1.5">
                      <Play className="h-4 w-4" /> {detail.watchDemo}
                    </Button>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => openProject(project.slug)}
                  >
                    {detail.viewFullDetails}{" "}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />
                  </Button>
                </motion.div>
              </div>

              {project.challenge && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="mt-8"
                >
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    {detail.challenge}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {project.challenge}
                  </p>
                </motion.div>
              )}

              {project.solution && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="mt-6"
                >
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    {detail.solution}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {project.solution}
                  </p>
                </motion.div>
              )}

              {project.workflow && project.workflow.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mt-8"
                >
                  <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                    Workflow
                  </h3>
                  <WorkflowTimeline steps={project.workflow} />
                </motion.div>
              )}

              {project.impact && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="bg-primary/5 mt-6 rounded-lg border p-4"
                >
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    Impact
                  </h3>
                  <p className="mt-1 text-sm font-medium">{project.impact}</p>
                </motion.div>
              )}

              {project.tech && project.tech.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="mt-6"
                >
                  <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                    {detail.stack}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="hover:border-primary/50 hover:bg-primary/20 hover:text-foreground transition-all duration-200"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {related.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="border-border/50 mt-10 border-t pt-8"
                >
                  <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                    {detail.related}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {related.map((r) => (
                      <button
                        key={r.slug}
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(r.slug);
                        }}
                        className="group text-left"
                      >
                        <Card className="hover:border-primary/30 h-full transition-all duration-200 hover:shadow-sm">
                          <CardHeader className="p-3 sm:p-4">
                            <Badge variant="secondary" className="mb-2 w-fit text-[10px]">
                              {r.category}
                            </Badge>
                            <CardTitle className="group-hover:text-primary text-sm transition-colors">
                              {r.name}
                            </CardTitle>
                            <CardDescription className="mt-1 line-clamp-2 text-xs">
                              {r.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="border-border/50 mt-8 border-t pt-6">
                <p className="text-muted-foreground text-sm">{detail.ctaTitle}</p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                >
                  <Link href="/contact">
                    <Button className="group mt-3">
                      {detail.ctaButton}
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
