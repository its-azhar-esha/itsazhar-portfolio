export const SITE_URL = "https://azhar.dev";
export const SITE_NAME = "Azhar Mahmud";

export interface DefaultSeo {
  title: string;
  description: string;
  keywords: string[];
  robots: string;
  canonical_url: string | null;
  og_image: string | null;
}

export const DEFAULT_SEO: Record<string, DefaultSeo> = {
  home: {
    title: "Azhar Mahmud | AI Automation Engineer",
    description: "AI automation solutions, workflow engineering, and intelligent business systems.",
    keywords: [
      "AI automation",
      "workflow engineering",
      "business automation",
      "AI engineer",
      "intelligent systems",
    ],
    robots: "index,follow",
    canonical_url: SITE_URL,
    og_image: null,
  },
  about: {
    title: "About Me — Azhar Mahmud | AI Automation Specialist",
    description:
      "I build intelligent automation systems that help businesses eliminate repetitive work, streamline operations, and scale efficiently using AI, workflows, and modern integrations.",
    keywords: ["about", "AI automation specialist", "workflow automation", "business automation"],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/about`,
    og_image: null,
  },
  projects: {
    title: "Featured Systems & Automation Projects | Azhar Mahmud",
    description:
      "Explore production-ready AI systems, workflow automations, and business solutions designed to eliminate repetitive work and improve operational efficiency.",
    keywords: ["projects", "AI systems", "automation projects", "workflow automations"],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/projects`,
    og_image: null,
  },
  services: {
    title: "Services | AI Automation Solutions",
    description:
      "AI agents, n8n workflow automation, API integration, document intelligence, and custom AI solutions to eliminate repetitive work and scale your business.",
    keywords: [
      "AI automation services",
      "AI agents",
      "n8n workflow automation",
      "API integration",
      "document intelligence",
      "business process automation",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/services`,
    og_image: null,
  },
  contact: {
    title: "Contact | Book a Free Automation Audit",
    description:
      "Book a free 15-minute automation audit. Find automation opportunities in your business workflow — no pressure, no obligation.",
    keywords: ["contact", "automation audit", "free consultation", "business workflow"],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/contact`,
    og_image: null,
  },
};
