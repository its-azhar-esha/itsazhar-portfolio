"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeUp } from "@/lib/motion";

const faqs = [
  {
    q: "What do you automate?",
    a: "I help businesses automate repetitive tasks, connect different tools, and build intelligent systems using AI agents, workflows, APIs, and automation platforms.",
  },
  {
    q: "What tools and technologies do you use?",
    a: "I primarily build with n8n, AI models, APIs, databases, and custom integrations. Depending on the project, I use tools like Supabase, PostgreSQL, Airtable, Google Workspace, and other business platforms.",
  },
  {
    q: "Can you automate my existing business process?",
    a: "Yes. I analyze existing workflows, identify bottlenecks, and design automation solutions customized around specific business needs.",
  },
  {
    q: "How long does an automation project take?",
    a: "The timeline depends on complexity. Simple workflows may take days, while advanced AI systems require more time for design, testing, and refinement.",
  },
  {
    q: "Do you provide support after delivery?",
    a: "Yes. I provide documentation and support to ensure automation systems remain reliable and easy to maintain.",
  },
  {
    q: "How do I get started?",
    a: "Book a free 15-minute automation audit. I will review your workflow and identify the best automation opportunities.",
  },
];

export function FAQ() {
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Everything you need to know about AI automation, workflows, and working together. Have
            another question? Book a free audit and let&apos;s discuss your needs.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
