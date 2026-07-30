"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Play, ChevronLeft, ChevronRight } from "lucide-react";
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
import { getFeaturedProjects } from "@/lib/projects-data";
import { fadeUp, cardEntrance, spring } from "@/lib/motion";
import type { Variants } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Project } from "@/lib/projects-data";

const ProjectModal = dynamic(
  () => import("./project-modal").then((m) => ({ default: m.ProjectModal })),
  {
    ssr: false,
  },
);

const tagStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};

const featuredTextVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.06, duration: 0.35 },
  }),
};

function FeaturedCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
  return (
    <Card className="border-primary/20 from-card to-background hover:border-primary/40 hover:shadow-primary/5 relative overflow-hidden bg-gradient-to-b transition-all duration-300 hover:shadow-lg">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />
      </div>
      <CardHeader className="relative">
        <motion.div variants={featuredTextVariants} initial="hidden" animate="visible" custom={0}>
          <Badge variant="secondary" className="mb-3 w-fit">
            {project.category}
          </Badge>
        </motion.div>
        <motion.div variants={featuredTextVariants} initial="hidden" animate="visible" custom={1}>
          <CardTitle className="text-xl">{project.name}</CardTitle>
        </motion.div>
        <motion.div variants={featuredTextVariants} initial="hidden" animate="visible" custom={2}>
          <CardDescription className="mt-2 text-sm">{project.description}</CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent className="relative">
        <motion.div
          variants={tagStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-1.5"
        >
          {project.tags.map((tag) => (
            <motion.div
              key={tag}
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
              }}
            >
              <Badge
                key={tag}
                variant="outline"
                className="hover:border-primary/50 hover:bg-primary/10 hover:text-foreground text-xs transition-all duration-200"
              >
                {tag}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
      <CardFooter className="relative gap-3">
        <motion.div
          variants={featuredTextVariants}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex gap-3"
        >
          {project.hasVideo && (
            <Button size="sm" className="gap-1.5" onClick={onSelect}>
              <Play className="h-3.5 w-3.5" /> Watch Demo
            </Button>
          )}
          <Button
            size="sm"
            variant={project.hasVideo ? "outline" : "default"}
            className="group gap-1.5"
            onClick={onSelect}
          >
            View Case Study{" "}
            <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[3px] group-hover:-translate-y-[2px]" />
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  );
}

function SmallCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
  return (
    <Card className="hover:border-primary/30 hover:shadow-primary/5 h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <Badge variant="secondary" className="mb-3 w-fit">
          {project.category}
        </Badge>
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <CardDescription className="mt-2 text-sm">{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="hover:border-primary/40 hover:bg-primary/5 text-xs transition-all duration-200"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-3">
        <Button size="sm" variant="outline" className="group gap-1.5" onClick={onSelect}>
          View Case Study{" "}
          <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[3px] group-hover:-translate-y-[2px]" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function Showcase() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [carouselHeight, setCarouselHeight] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef(0);

  React.useEffect(() => {
    getFeaturedProjects().then(setProjects);
  }, []);

  React.useLayoutEffect(() => {
    if (carouselRef.current) {
      setCarouselHeight(carouselRef.current.offsetHeight);
    }
  }, []);

  const n = projects.length;

  const activeIndices = React.useMemo(() => [index, (index + 1) % n, (index + 2) % n], [index, n]);

  const goNext = React.useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % n);
  }, [n]);

  const goPrev = React.useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + n) % n);
  }, [n]);

  React.useEffect(() => {
    if (isPaused || n === 0) return;
    const id = setInterval(goNext, 4500);
    return () => clearInterval(id);
  }, [isPaused, goNext, n]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const exitAnimation = (pos: number) => {
    if (direction > 0) {
      return pos === 0 ? { y: 30, scale: 0.95, opacity: 0 } : { y: 20, opacity: 0 };
    }
    return pos === 0 ? { y: -30, scale: 0.95, opacity: 0 } : { y: -20, opacity: 0 };
  };

  const enterAnimation = (pos: number) => {
    if (direction > 0) {
      return pos === 0 ? { y: -20, scale: 0.98, opacity: 0 } : { y: 15, opacity: 0 };
    }
    return pos === 0 ? { y: 20, scale: 0.98, opacity: 0 } : { y: -15, opacity: 0 };
  };

  if (projects.length === 0) return null;

  return (
    <section id="projects" className="border-border/40 border-t py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Featured Systems & Automation Demos
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Explore AI-powered systems built to solve real operational challenges — combining
            automation workflows, AI agents, and intelligent integrations to create scalable
            business solutions.
          </p>
        </motion.div>

        <>
          <div
            className="relative mt-16 hidden md:block"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.button
              onClick={goPrev}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className="bg-background text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/3 -left-3 z-10 hidden -translate-y-1/2 rounded-full border p-2 shadow-sm transition-colors lg:flex"
              aria-label="Previous project"
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <motion.button
              onClick={goNext}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className="bg-background text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/3 -right-3 z-10 hidden -translate-y-1/2 rounded-full border p-2 shadow-sm transition-colors lg:flex"
              aria-label="Next project"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>

            <div
              ref={carouselRef}
              style={
                carouselHeight > 0
                  ? { minHeight: carouselHeight + 100, overflow: "hidden" }
                  : undefined
              }
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {activeIndices.map((projectIndex, pos) => {
                    const project = projects[projectIndex];
                    const isFeatured = pos === 0;
                    const isRight = pos === 2;

                    return (
                      <motion.div
                        key={project.slug}
                        className={
                          isFeatured
                            ? "row-start-1 lg:col-span-2"
                            : isRight
                              ? "row-start-3 lg:col-start-2 lg:row-start-2"
                              : "row-start-2 lg:col-start-1 lg:row-start-2"
                        }
                        initial={enterAnimation(pos)}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={exitAnimation(pos)}
                        transition={{
                          y: { type: "spring", stiffness: 300, damping: 28 },
                          scale: { type: "spring", stiffness: 300, damping: 28 },
                          opacity: { duration: 0.25 },
                        }}
                        whileHover={{
                          y: -4,
                          boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08)",
                          transition: { type: "spring", stiffness: 300, damping: 25 },
                        }}
                      >
                        {isFeatured ? (
                          <FeaturedCard
                            project={project}
                            onSelect={() => setSelectedProject(project)}
                          />
                        ) : (
                          <SmallCard
                            project={project}
                            onSelect={() => setSelectedProject(project)}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                {projects.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > index ? 1 : -1);
                      setIndex(i);
                    }}
                    className="relative flex h-2 items-center justify-center"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <motion.span
                      animate={{
                        width: i === index ? 32 : 8,
                        backgroundColor:
                          i === index
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted-foreground) / 0.3)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="block h-2 rounded-full"
                      style={{ width: i === index ? 32 : 8 }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 md:hidden">
            {projects.map((project, i) => (
              <motion.div
                key={project.slug}
                variants={cardEntrance}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileTap={{
                  scale: 0.98,
                  transition: { type: "spring", stiffness: 400, damping: 20 },
                }}
              >
                <Card className="border-primary/20 from-card to-background hover:border-primary/30 relative overflow-hidden bg-gradient-to-b transition-all duration-300">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="bg-primary/5 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl" />
                  </div>
                  <CardHeader className="relative">
                    <Badge variant="secondary" className="mb-3 w-fit">
                      {project.category}
                    </Badge>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="relative gap-3">
                    {project.hasVideo && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Play className="h-3.5 w-3.5" /> Watch Demo
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="group gap-1.5"
                      onClick={() => setSelectedProject(project)}
                    >
                      View Case Study{" "}
                      <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[3px] group-hover:-translate-y-[2px]" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 flex justify-center"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
            <Link href="/projects">
              <Button variant="outline" size="lg" className="group gap-2">
                View All Projects
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <ProjectModal
        project={selectedProject}
        projects={projects}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
