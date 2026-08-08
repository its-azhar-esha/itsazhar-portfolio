import { SITE_URL } from "@/lib/site";
export { SITE_URL };
export const SITE_NAME = "Azhar Mahmud";
export const SITE_BRAND = "ItsAzhar";

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
    title: "Azhar (ItsAzhar) | AI Automation Expert & n8n Developer",
    description:
      "AI Automation Expert at ItsAzhar — I build AI agents, n8n workflow automation, and API integrations that eliminate repetitive work and scale your business. Free automation audit.",
    keywords: [
      "AI automation",
      "AI automation expert",
      "automation expert",
      "automation specialist",
      "automation freelancer",
      "workflow automation",
      "business automation",
      "process automation",
      "n8n expert",
      "n8n developer",
      "AI agent developer",
      "AI consultant",
      "API integration",
      "custom automation",
      "ItsAzhar",
      "Azhar",
      "itsazhar.com",
    ],
    robots: "index,follow",
    canonical_url: SITE_URL,
    og_image: null,
  },
  about: {
    title: "About Azhar Mahmud — ItsAzhar | AI Automation Expert",
    description:
      "Meet Azhar (ItsAzhar): an AI Automation Expert and n8n Developer building AI agents, custom workflow automation, and business process automation for companies worldwide.",
    keywords: [
      "about",
      "AI automation expert",
      "automation specialist",
      "n8n developer",
      "AI agent developer",
      "AI consultant",
      "workflow automation",
      "business automation",
      "ItsAzhar",
      "Azhar Mahmud",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/about`,
    og_image: null,
  },
  projects: {
    title: "Automation Projects & Case Studies | Azhar (ItsAzhar)",
    description:
      "Real n8n workflow automation, AI agent, and API integration projects by Azhar (ItsAzhar) — AI automation systems that eliminate repetitive work and improve operational efficiency.",
    keywords: [
      "projects",
      "AI automation projects",
      "workflow automation",
      "n8n projects",
      "AI agent projects",
      "API integration projects",
      "business automation",
      "process automation",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/projects`,
    og_image: null,
  },
  services: {
    title: "AI Automation Services | n8n Workflows & AI Agents — ItsAzhar",
    description:
      "AI automation services by Azhar (ItsAzhar): n8n workflow automation, AI agents, API integrations, and custom business process automation that eliminate repetitive work and scale your business.",
    keywords: [
      "AI automation services",
      "AI automation expert",
      "n8n expert",
      "n8n developer",
      "AI agent developer",
      "AI consultant",
      "API integration",
      "custom automation",
      "process automation",
      "workflow automation",
      "business automation",
      "automation freelancer",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/services`,
    og_image: null,
  },
  contact: {
    title: "Contact Azhar (ItsAzhar) | Book a Free Automation Audit",
    description:
      "Hire an AI automation freelancer. Book a free 15-minute automation audit with Azhar (ItsAzhar) — find automation opportunities in your business workflow, no pressure, no obligation.",
    keywords: [
      "contact",
      "automation audit",
      "hire automation freelancer",
      "AI automation expert",
      "free consultation",
      "business workflow",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/contact`,
    og_image: null,
  },
  blog: {
    title: "AI Automation Blog | n8n, AI Agents & Workflow Guides — ItsAzhar",
    description:
      "Actionable guides on AI automation, n8n workflows, AI agents, API integrations and business process automation by Azhar (ItsAzhar), an AI Automation Expert.",
    keywords: [
      "blog",
      "AI automation",
      "n8n workflows",
      "n8n expert",
      "AI agents",
      "API integration",
      "workflow automation",
      "business automation",
      "process automation",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/blog`,
    og_image: null,
  },
  hub: {
    title: "Automation Hub | Free n8n Templates, AI Agents & Tools — ItsAzhar",
    description:
      "Free n8n templates, AI agents, prompts and automation tools from Azhar (ItsAzhar). Copy, adapt and ship workflow automation in minutes.",
    keywords: [
      "automation hub",
      "n8n templates",
      "AI agents",
      "prompts",
      "workflow automation",
      "business automation",
      "custom automation",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/hub`,
    og_image: null,
  },
  playground: {
    title: "Workflow Playground | Visual n8n-Style Automation Builder — ItsAzhar",
    description:
      "Visual workflow builder with copy-paste-ready automation templates from Azhar (ItsAzhar). Build, share and remix n8n-style automation flows in your browser.",
    keywords: [
      "workflow playground",
      "visual builder",
      "automation templates",
      "n8n",
      "workflow automation",
      "custom automation",
      "ItsAzhar",
    ],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/playground`,
    og_image: null,
  },
  terms: {
    title: "Terms & Conditions | ItsAzhar — AI Automation",
    description:
      "Terms and conditions for using the website and the AI automation services provided by Azhar Mahmud (ItsAzhar).",
    keywords: ["terms", "conditions", "ItsAzhar", "legal"],
    robots: "index,follow",
    canonical_url: `${SITE_URL}/terms`,
    og_image: null,
  },
};
