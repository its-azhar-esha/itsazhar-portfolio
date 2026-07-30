"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIn, cardEntrance, roleShuffle } from "@/lib/motion";
import Link from "next/link";

const roles = [
  "AI Automation Specialist",
  "Workflow Engineer",
  "AI Systems Builder",
  "Automation Architect",
];

function RoleShuffle() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={roles[index]}
          variants={roleShuffle}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-primary text-sm font-medium"
        >
          {roles[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="border-border/40 border-t py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-5 md:gap-12">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            className="flex justify-center md:col-span-2 md:justify-end"
          >
            <div className="group border-border/60 from-primary/15 via-primary/5 to-background hover:border-primary/30 hover:shadow-primary/5 relative h-40 w-40 overflow-hidden rounded-2xl border bg-gradient-to-br transition-all duration-300 hover:shadow-lg">
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="bg-primary/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
                    <Sparkles className="text-primary h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs font-medium">Azhar</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardEntrance}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center md:col-span-3 md:text-left"
          >
            <h2 className="text-2xl font-semibold tracking-tight">Hi, I&apos;m Azhar</h2>
            <p className="text-primary mt-1 text-sm font-medium">AI Automation Specialist</p>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed">
              I build intelligent automation systems using n8n, AI agents, APIs, and custom
              workflows that help businesses reduce repetitive work and improve operations.
            </p>
            <div className="mt-3 flex justify-center md:justify-start">
              <RoleShuffle />
            </div>
            <div className="mt-5 flex justify-center md:justify-start">
              <Link href="/about">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Button variant="outline" size="sm" className="group gap-1.5">
                    More About Me
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-[3px]" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
