"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, scaleIn } from "@/lib/motion";
import Link from "next/link";

export function CTA({
  copy,
}: {
  copy: {
    badge: string;
    title: string;
    intro: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
}) {
  return (
    <section className="border-border/40 border-t py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="from-card to-background relative overflow-hidden rounded-2xl border bg-gradient-to-b p-8 sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary/10 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
            <div className="bg-primary/5 absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="bg-background text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
                <Sparkles className="text-primary h-4 w-4" />
                <span>{copy.badge}</span>
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              {copy.title}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-muted-foreground mt-4 max-w-xl text-lg"
            >
              {copy.intro}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="/contact"
                  data-track="cta_click"
                  data-track-label="Home CTA: Book audit"
                >
                  <Button size="xl" className="group gap-2 text-base">
                    {copy.primaryLabel}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link href="/projects">
                  <Button variant="outline" size="xl" className="text-base">
                    {copy.secondaryLabel}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
