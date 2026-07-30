import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore production-ready AI systems, workflow automations, and business solutions built with AI agents, n8n, and modern integrations across 20+ industries.",
  openGraph: {
    title: "Projects | AI Automation Systems & Workflows",
    description:
      "Real AI automation projects built with AI agents, n8n, Supabase, and modern integrations across Healthcare, Finance, Logistics, and more.",
    url: "https://azhar.dev/projects",
  },
  twitter: {
    title: "Projects | AI Automation Systems & Workflows",
    description:
      "Real AI automation projects across 20+ industries — Healthcare, Finance, Logistics, and more.",
  },
  alternates: { canonical: "https://azhar.dev/projects" },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
