"use client"

import { motion } from "framer-motion"
import { ArrowRight, BarChart3, FileText, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fadeUp } from "@/lib/motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const caseStudies = [
  {
    id: "fleet",
    icon: BarChart3,
    title: "Fleet Intelligence System",
    subtitle: "Logistics AI",
    challenge:
      "Manual fleet monitoring was reactive, slow, and prone to missed incidents.",
    solution:
      "A real-time AI system that analyzes fleet activity, detects risks, and provides instant operational insights.",
    workflow: [
      "Tracks vehicle and driver data",
      "AI analyzes route behavior, delays, and anomalies",
      "Automatically flags issues and sends alerts",
      "Built with n8n + Supabase + LLM-based analysis",
    ],
    impact:
      "Transformed manual fleet monitoring into an intelligent automated safety system.",
  },
  {
    id: "lease",
    icon: FileText,
    title: "Lease Intelligence System",
    subtitle: "Real Estate AI",
    challenge:
      "Manual lease review was slow, inconsistent, and easy to miss critical clauses.",
    solution:
      "Automated extraction of important lease information from PDFs with structured summaries.",
    workflow: [
      "Extracts clauses like rent, renewal, and termination",
      "Processes PDF documents automatically",
      "Generates structured summaries",
      "Stores business data securely",
    ],
    impact:
      "Reduces manual document review and helps prevent missed contract details.",
  },
  {
    id: "education",
    icon: GraduationCap,
    title: "Education Automation System",
    subtitle: "EdTech SaaS",
    challenge:
      "Manual school processes were scattered, error-prone, and difficult to scale.",
    solution:
      "An automation-first system built using n8n workflows for school operations.",
    workflow: [
      "Handles student/admin workflows",
      "Automates notifications",
      "Processes data using AI",
      "Uses PostgreSQL database",
    ],
    impact:
      "Shows how scalable SaaS-like systems can be created using automation-first architecture.",
  },
]

export function CaseStudies() {
  return (
    <section className="border-t border-border/40 py-24">
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
            From manual to automated.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Each case study explains the problem, automation approach, workflow
            design, and business impact behind each system.
          </p>
        </motion.div>

        <Tabs defaultValue="fleet" className="mt-12">
          <div className="flex justify-center">
            <TabsList>
              {caseStudies.map((cs) => (
                <TabsTrigger key={cs.id} value={cs.id}>
                  {cs.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

            {caseStudies.map((cs) => (
            <TabsContent key={cs.id} value={cs.id} className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mx-auto max-w-4xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <cs.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge variant="secondary">{cs.subtitle}</Badge>
                        <CardTitle className="mt-1 text-xl">{cs.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-0 md:space-y-6">
                    <div className="relative border-l-2 border-border pl-4 pb-6 md:border-l-0 md:pl-0 md:pb-0">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-destructive bg-background md:hidden" />
                      <h4 className="mb-2 text-sm font-semibold text-destructive md:text-base">
                        The Challenge
                      </h4>
                      <p className="text-sm text-muted-foreground">{cs.challenge}</p>
                    </div>

                    <div className="relative border-l-2 border-border pl-4 pb-6 md:border-l-0 md:pl-0 md:pb-0">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-background md:hidden" />
                      <h4 className="mb-2 text-sm font-semibold text-primary md:text-base">
                        The Solution
                      </h4>
                      <p className="text-sm text-muted-foreground">{cs.solution}</p>
                    </div>

                    <div className="relative border-l-2 border-border pl-4 pb-6 md:border-l-0 md:pl-0 md:pb-0">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-foreground bg-background md:hidden" />
                      <h4 className="mb-2 text-sm font-semibold md:text-base">Workflow</h4>
                      <ul className="space-y-1.5">
                        {cs.workflow.map((step) => (
                          <li key={step} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="relative border-l-2 border-border pl-4 md:border-l-0 md:pl-0">
                      <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-emerald-500 bg-background md:hidden" />
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <h4 className="mb-1 text-sm font-semibold">Impact</h4>
                        <p className="text-sm text-muted-foreground">{cs.impact}</p>
                      </div>
                    </div>

                    <div className="pt-6 md:pt-0">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Button variant="outline" size="sm" className="group gap-1.5">
                          Read Full Case Study
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-[3px]" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            ))}
        </Tabs>
      </div>
    </section>
  )
}
