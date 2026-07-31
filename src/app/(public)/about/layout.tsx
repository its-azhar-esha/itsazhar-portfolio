import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Azhar | AI Automation Systems",
  description:
    "I build intelligent automation systems that help businesses eliminate repetitive work, streamline operations, and scale efficiently using AI, workflows, and modern integrations.",
  openGraph: {
    title: "About Azhar | AI Automation Specialist from Bangladesh",
    description:
      "I build intelligent automation systems using AI agents, n8n workflows, API integrations, and business automation — helping companies eliminate repetitive work and scale faster.",
    url: `${SITE_URL}/about`,
    siteName: "Azhar | AI Automation Systems",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Azhar | AI Automation Specialist",
    description:
      "I build intelligent automation systems using AI agents, n8n workflows, API integrations, and business automation.",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Azhar Mahmud Alif",
      jobTitle: "AI Automation Specialist",
      url: `${SITE_URL}/about`,
      knowsAbout: [
        "AI Agents",
        "Workflow Automation",
        "n8n",
        "Supabase",
        "React",
        "TypeScript",
        "API Integration",
        "Business Automation",
      ],
    }),
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
