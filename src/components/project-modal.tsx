"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, ExternalLink, ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { modalOverlay, modalSlideUp, spring, springSoft, easeInOut } from "@/lib/motion"
import type { Project } from "@/lib/projects"
import Link from "next/link"

interface ProjectModalProps {
  project: Project | null
  projects: Project[]
  onClose: () => void
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
            <div className="absolute left-[11px] top-5 h-full w-px bg-border" />
          )}
          <div className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.15, type: "spring", stiffness: 400, damping: 20 }}
              className="h-2 w-2 rounded-full bg-primary"
            />
          </div>
          <div className="pt-0.5">
            <p className="text-sm text-muted-foreground">{step}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function ProjectModal({ project, projects, onClose }: ProjectModalProps) {
  const related = React.useMemo(() => {
    if (!project) return []
    return projects.filter((p) => p.slug !== project.slug).slice(0, 3)
  }, [project, projects])

  React.useEffect(() => {
    if (!project) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [project, onClose])

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm md:items-center"
          onClick={onClose}
        >
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
            className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border bg-card shadow-2xl md:max-w-2xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary)/0.3)" }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <div className="mb-6 flex items-center justify-between gap-2">
                <Badge variant="secondary" className="w-fit">{project.category}</Badge>
                {project.status && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {project.status}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.longDescription}</p>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground">{tag}</Badge>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {project.hasVideo && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                    <Button className="gap-1.5">
                      <Play className="h-4 w-4" /> Watch Full Demo
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                  <Button variant="outline" className="gap-1.5">
                    View Case Study <ExternalLink className="h-4 w-4" />
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
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">The Challenge</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.challenge}</p>
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
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">The Solution</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.solution}</p>
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
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Workflow</h3>
                  <WorkflowTimeline steps={project.workflow} />
                </motion.div>
              )}

              {project.impact && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-6 rounded-lg border bg-primary/5 p-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Impact</h3>
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
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Technology Stack</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <Badge key={t} variant="secondary" className="transition-all duration-200 hover:border-primary/50 hover:bg-primary/20 hover:text-foreground">{t}</Badge>
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
                  className="mt-10 border-t border-border/50 pt-8"
                >
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related Projects</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {related.map((r) => (
                      <button
                        key={r.slug}
                        onClick={(e) => { e.stopPropagation(); onClose() }}
                        className="group text-left"
                      >
                        <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                          <CardHeader className="p-3 sm:p-4">
                            <Badge variant="secondary" className="mb-2 w-fit text-[10px]">{r.category}</Badge>
                            <CardTitle className="text-sm transition-colors group-hover:text-primary">{r.name}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2 text-xs">{r.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="mt-8 border-t border-border/50 pt-6">
                <p className="text-sm text-muted-foreground">
                  Interested in a similar system for your business?
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
                  <Link href="/contact">
                    <Button className="mt-3 group">
                      Book a Free 15-Min Audit
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
  )
}
