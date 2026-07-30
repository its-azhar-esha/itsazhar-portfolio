import type { Metadata } from "next";
import { getPublicAboutContent } from "@/lib/about";
import { AboutPageClient } from "@/components/about/about-page-client";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const content = await getPublicAboutContent();
    return {
      title: content.seo.title,
      description: content.seo.description,
    };
  } catch {
    return {
      title: "About Me — AI Automation Specialist",
      description:
        "I build intelligent automation systems that help businesses eliminate repetitive work, streamline operations, and scale efficiently using AI, workflows, and modern integrations.",
    };
  }
}

export default async function AboutPage() {
  const content = await getPublicAboutContent();
  return <AboutPageClient content={content} />;
}
