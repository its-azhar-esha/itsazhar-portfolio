"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Bot,
  Workflow,
  Cable,
  FileText,
  Building2,
  Cpu,
} from "lucide-react"
import { fadeUp, cardEntrance } from "@/lib/motion"

const features = [
  {
    icon: Bot,
    title: "AI Agents & Intelligent Assistants",
    description:
      "Build AI-powered assistants that understand requests, make decisions, and automate complex tasks across business operations.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation with n8n",
    description:
      "Design reliable automation workflows that connect your tools, move data automatically, and eliminate repetitive manual processes.",
  },
  {
    icon: Cable,
    title: "API & System Integration",
    description:
      "Connect different platforms, databases, and services to create seamless automated ecosystems.",
  },
  {
    icon: FileText,
    title: "Document Intelligence Systems",
    description:
      "Extract, classify, analyze, and process documents using AI-powered automation pipelines.",
  },
  {
    icon: Building2,
    title: "Business Process Automation",
    description:
      "Transform slow manual processes into efficient, scalable systems that save time and reduce errors.",
  },
  {
    icon: Cpu,
    title: "Custom AI Automation Solutions",
    description:
      "Build tailored automation systems based on unique business challenges and operational goals.",
  },
]

function ServiceCard({ feature, i }: { feature: typeof features[0]; i: number }) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      onClick={() => setExpanded(!expanded)}
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08)", transition: { type: "spring", stiffness: 300, damping: 25 } }}
      whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className="group cursor-pointer rounded-xl border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 md:cursor-default"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <feature.icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{feature.title}</h3>
      <div className="md:hidden">
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="mt-2 flex justify-center text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>
      <p className="mt-2 hidden text-sm text-muted-foreground md:block">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="services" className="border-t border-border/40 py-24">
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
            What I build.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Intelligent automation systems designed around real business needs.
            From AI agents to workflow orchestration, I build scalable solutions
            that reduce manual effort, improve efficiency, and help teams
            operate smarter.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ServiceCard key={feature.title} feature={feature} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
