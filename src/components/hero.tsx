"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeUp, scaleIn, slideUp, spring, springSoft, cardHover } from "@/lib/motion";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { HeroContent, HeroMetric } from "@/types/hero";

interface HeroProps {
  content: HeroContent;
  metrics: HeroMetric[];
}

const particlePositions = [
  { left: "15%", top: "20%" },
  { left: "75%", top: "15%" },
  { left: "85%", top: "55%" },
  { left: "10%", top: "70%" },
  { left: "50%", top: "8%" },
  { left: "90%", top: "75%" },
  { left: "30%", top: "85%" },
  { left: "65%", top: "45%" },
];

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = React.useState(0);
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1]) : 0;
  const suffix = match ? match[2] : "";

  React.useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [inView, target]);

  return (
    <motion.div
      ref={ref}
      whileHover={{ ...cardHover, transition: springSoft }}
      whileTap={{ scale: 0.97, transition: spring }}
      className="group bg-card hover:border-primary/30 hover:shadow-primary/5 relative overflow-hidden rounded-xl border p-6 text-center transition-all duration-300 hover:shadow-lg"
    >
      <p className="text-3xl font-bold tracking-tight md:text-4xl">
        {count}
        {suffix}
      </p>
      <p className="text-muted-foreground mt-1.5 text-sm">{label}</p>
    </motion.div>
  );
}

export function Hero({ content, metrics }: HeroProps) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const sectionRef = React.useRef<HTMLElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    },
    [isDesktop],
  );

  const { basic, actions, badges } = content;

  return (
    <section
      id="home"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden pt-32 pb-20 md:pt-40"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: mousePos.x * -8, y: mousePos.y * -8 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="bg-primary/5 absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: mousePos.x * 6, y: mousePos.y * 6 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="bg-primary/3 absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: mousePos.x * -10, y: mousePos.y * -6 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="bg-primary/5 absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full blur-3xl"
        />
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="bg-primary/20 absolute h-1 w-1 rounded-full"
            style={{ left: pos.left, top: pos.top }}
            animate={{
              y: [0, -(20 + i * 2), 0],
              opacity: [0.08, 0.25, 0.08],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block h-2 w-2 rounded-full bg-green-500"
              />
              {basic.availability}
            </Badge>
          </motion.div>

          <div className="max-w-4xl">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {basic.headline}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.35, duration: 0.5 }}
              className="from-foreground via-foreground to-foreground/60 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {basic.highlight}
            </motion.p>
          </div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-muted-foreground mx-auto mt-6 max-w-[620px] text-lg md:text-xl"
          >
            {basic.subheadline}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <motion.div
              whileHover={{ scale: 1.02, boxShadow: "0 0 24px hsl(var(--primary)/0.15)" }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
            >
              <Link href={actions.primary.href}>
                <Button size="xl" className="group gap-2 text-base shadow-sm">
                  {actions.primary.label}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
              <Link href={actions.secondary.href}>
                <Button variant="outline" size="xl" className="text-base">
                  {actions.secondary.label}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.8 } },
            }}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {badges.map((item) => (
              <motion.span
                key={item}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className="bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm transition-all duration-200"
              >
                <motion.span
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="text-primary"
                >
                  ✓
                </motion.span>{" "}
                {item}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {metrics.map((stat) => (
            <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
