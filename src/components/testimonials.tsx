"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { fadeUp, roleShuffle } from "@/lib/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicTestimonial } from "@/types/testimonial";

const ROTATE_MS = 6000;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const items = React.useMemo(() => testimonials.filter((t) => t.name && t.quote), [testimonials]);
  const [[index, direction], setIndex] = React.useState<[number, number]>([0, 0]);
  const paused = React.useRef(false);

  const go = React.useCallback(
    (dir: number) => {
      if (items.length === 0) return;
      setIndex(([i]) => [(i + dir + items.length) % items.length, dir]);
    },
    [items.length],
  );

  React.useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      if (!paused.current) go(1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [go, items.length]);

  if (items.length === 0) return null;

  const current = items[index % items.length];

  return (
    <section className="border-border/40 border-t py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What clients say.</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Real feedback from the people I&apos;ve built with.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12 flex justify-center"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          <div className="relative w-full max-w-3xl">
            <Quote className="text-primary/20 absolute -top-6 -left-2 h-16 w-16 -scale-x-100 sm:-left-10" />

            <div className="bg-card border-border/50 relative min-h-[320px] overflow-hidden rounded-2xl border p-6 shadow-sm sm:min-h-[280px] sm:p-10">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.figure
                  key={current.name + current.quote}
                  custom={direction}
                  variants={roleShuffle}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex h-full flex-col items-center text-center"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < current.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mt-6 flex-1 text-base leading-relaxed sm:text-lg">
                    “{current.quote}”
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-3">
                    <Avatar className="h-11 w-11 border">
                      {current.avatar ? (
                        <AvatarImage src={current.avatar} alt={current.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {initials(current.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{current.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {current.role}
                        {current.company ? ` · ${current.company}` : ""}
                      </p>
                    </div>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            {items.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {items.map((item, i) => (
                    <button
                      key={item.name + i}
                      onClick={() => setIndex([i, i > index ? 1 : -1])}
                      aria-label={`Show testimonial ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index % items.length
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
