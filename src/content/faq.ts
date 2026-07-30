export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

export const faqItems: FAQItem[] = [
  {
    id: "what-do-you-automate",
    question: "What do you automate?",
    answer:
      "I help businesses automate repetitive tasks, connect different tools, and build intelligent systems using AI agents, workflows, APIs, and automation platforms.",
  },
  {
    id: "what-tools-do-you-use",
    question: "What tools and technologies do you use?",
    answer:
      "I primarily build with n8n, AI models, APIs, databases, and custom integrations. Depending on the project, I use tools like Supabase, PostgreSQL, Airtable, Google Workspace, and other business platforms.",
  },
  {
    id: "can-you-automate-existing-process",
    question: "Can you automate my existing business process?",
    answer:
      "Yes. I analyze existing workflows, identify bottlenecks, and design automation solutions customized around specific business needs.",
  },
  {
    id: "how-long-does-it-take",
    question: "How long does an automation project take?",
    answer:
      "The timeline depends on complexity. Simple workflows may take days, while advanced AI systems require more time for design, testing, and refinement.",
  },
  {
    id: "do-you-provide-support",
    question: "Do you provide support after delivery?",
    answer:
      "Yes. I provide documentation and support to ensure automation systems remain reliable and easy to maintain.",
  },
  {
    id: "how-to-get-started",
    question: "How do I get started?",
    answer:
      "Book a free 15-minute automation audit. I will review your workflow and identify the best automation opportunities.",
  },
]
