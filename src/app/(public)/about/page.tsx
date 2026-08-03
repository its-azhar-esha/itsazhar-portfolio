import type { Metadata } from "next";
import { getPublicAboutContent } from "@/lib/about";
import { getPublicStats } from "@/lib/stats";
import { getPageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site/urls";
import { AboutPageClient } from "@/components/about/about-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getPageMetadata("about");
  const siteUrl = await getSiteUrl();
  return {
    ...base,
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Azhar Mahmud Alif",
        jobTitle: "AI Automation Specialist",
        url: `${siteUrl}/about`,
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
}

export default async function AboutPage() {
  const [content, stats] = await Promise.all([getPublicAboutContent(), getPublicStats()]);
  return (
    <AboutPageClient
      content={content}
      stats={[
        { label: "Projects", value: stats.projects },
        { label: "Technologies", value: stats.technologies },
        { label: "Industries", value: stats.industries },
        { label: "Workflows", value: stats.workflows },
      ]}
    />
  );
}
