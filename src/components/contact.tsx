"use client";

import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Clock, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, spring } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinks } from "@/components/social-links";
import Link from "next/link";

const benefits = [
  "Identify repetitive tasks",
  "Find automation opportunities",
  "Get actionable recommendations",
  "No charge",
  "No obligation",
];

export function Contact() {
  return (
    <section id="contact" className="border-border/40 border-t py-24">
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
            Let&apos;s automate something.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Have a repetitive process slowing your business down? Book a free 15-minute automation
            audit. I&apos;ll review your workflow, identify automation opportunities, and suggest
            the right approach — with no pressure and no obligation.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Card className="border-primary/20 from-card to-background hover:shadow-primary/5 h-full bg-gradient-to-b transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    Free
                  </Badge>
                  <CardTitle className="text-xl">Free Automation Audit</CardTitle>
                  <CardDescription>
                    15-minute call to discover automation opportunities in your business workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="text-muted-foreground flex items-center gap-2 text-sm"
                      >
                        <Check className="text-primary h-4 w-4 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                    >
                      <Link href="/contact">
                        <Button
                          size="lg"
                          className="group gap-2 shadow-sm transition-shadow duration-200 hover:shadow-md"
                        >
                          Book Free 15-Min Audit
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                    >
                      <Link href="/projects">
                        <Button variant="outline" size="lg" className="group gap-2">
                          View Projects
                          <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px] group-hover:-translate-y-[2px]" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4 lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Find me on</CardTitle>
              </CardHeader>
              <CardContent>
                <SocialLinks />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPin className="text-primary h-4 w-4 shrink-0" />
                  Remote, Worldwide
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="text-primary h-4 w-4 shrink-0" />
                  Response Time: Within 24 Hours
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
