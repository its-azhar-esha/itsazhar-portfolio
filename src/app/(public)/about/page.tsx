import type { Metadata } from "next";
import { getPublicAboutContent } from "@/lib/about";
import { getPublicStats } from "@/lib/stats";
import { getPageMetadata } from "@/lib/seo";
import { AboutPageClient } from "@/components/about/about-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about");
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
