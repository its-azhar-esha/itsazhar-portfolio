import type { HeroContent } from "@/types/hero";

export const DEFAULT_HERO_CONTENT: HeroContent = {
  basic: {
    headline: "Automate anything.",
    highlight: "Scale everything.",
    subheadline:
      "I design and build intelligent automation systems that eliminate repetitive work, streamline operations, and help businesses scale faster. From AI agents and n8n workflows to custom integrations, I turn complex processes into reliable automated systems.",
    availability: "Available for Automation Projects",
    location: "",
  },
  actions: {
    primary: {
      label: "Book a Free 15-Min Audit",
      href: "/contact",
    },
    secondary: {
      label: "View Projects",
      href: "/projects",
    },
  },
  badges: ["AI Agents", "n8n", "APIs", "Workflow Automation", "Business Systems"],
  background: {
    image: "",
    video: "",
  },
  seo: {
    title: "AI Automation & Intelligent Systems",
    description:
      "I design and build intelligent automation systems that eliminate repetitive work, streamline operations, and help businesses scale faster.",
  },
};
