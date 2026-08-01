"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CASE_STUDY_ICONS } from "@/constants/case-studies";
import type { PublicCaseStudy } from "@/types/case-study";
import { MOCK_CASE_STUDIES, toPublicCaseStudy } from "@/lib/case-studies/mock-data";

const FALLBACK_STUDIES: PublicCaseStudy[] = MOCK_CASE_STUDIES.filter(
  (cs) => cs.status === "published",
).map(toPublicCaseStudy);

export function CaseStudies({
  studies,
  copy,
}: {
  studies?: PublicCaseStudy[];
  copy: {
    title: string;
    intro: string;
    challenge: string;
    solution: string;
    workflow: string;
    impact: string;
    readMore: string;
  };
}) {
  const items = studies && studies.length > 0 ? studies : FALLBACK_STUDIES;
  const active = items[0]?.slug ?? "";

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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{copy.intro}</p>
        </motion.div>

        {items.length > 0 && (
          <Tabs defaultValue={active} className="mt-12">
            <div className="flex flex-wrap justify-center">
              <TabsList>
                {items.map((cs) => (
                  <TabsTrigger key={cs.slug} value={cs.slug}>
                    {cs.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {items.map((cs) => {
              const Icon = CASE_STUDY_ICONS[cs.icon] ?? CASE_STUDY_ICONS.fleet;
              return (
                <TabsContent key={cs.slug} value={cs.slug} className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mx-auto max-w-4xl">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            {cs.subtitle && <Badge variant="secondary">{cs.subtitle}</Badge>}
                            <CardTitle className="mt-1 text-xl">{cs.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-0 md:space-y-6">
                        <div className="border-border relative border-l-2 pb-6 pl-4 md:border-l-0 md:pb-0 md:pl-0">
                          <span className="border-destructive bg-background absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 md:hidden" />
                          <h4 className="text-destructive mb-2 text-sm font-semibold md:text-base">
                            {copy.challenge}
                          </h4>
                          <p className="text-muted-foreground text-sm">{cs.challenge}</p>
                        </div>

                        <div className="border-border relative border-l-2 pb-6 pl-4 md:border-l-0 md:pb-0 md:pl-0">
                          <span className="border-primary bg-background absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 md:hidden" />
                          <h4 className="text-primary mb-2 text-sm font-semibold md:text-base">
                            {copy.solution}
                          </h4>
                          <p className="text-muted-foreground text-sm">{cs.solution}</p>
                        </div>

                        <div className="border-border relative border-l-2 pb-6 pl-4 md:border-l-0 md:pb-0 md:pl-0">
                          <span className="border-foreground bg-background absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 md:hidden" />
                          <h4 className="mb-2 text-sm font-semibold md:text-base">
                            {copy.workflow}
                          </h4>
                          <ul className="space-y-1.5">
                            {cs.workflow.map((step) => (
                              <li
                                key={step}
                                className="text-muted-foreground flex items-center gap-2 text-sm"
                              >
                                <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-border relative border-l-2 pl-4 md:border-l-0 md:pl-0">
                          <span className="bg-background absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 border-emerald-500 md:hidden" />
                          <div className="bg-muted/50 rounded-lg border p-4">
                            <h4 className="mb-1 text-sm font-semibold">{copy.impact}</h4>
                            <p className="text-muted-foreground text-sm">{cs.impact}</p>
                          </div>
                        </div>

                        <div className="pt-6 md:pt-0">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Button variant="outline" size="sm" className="group gap-1.5">
                              {copy.readMore}
                              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-[3px]" />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </section>
  );
}
