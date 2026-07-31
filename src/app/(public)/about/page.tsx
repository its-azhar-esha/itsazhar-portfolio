import type { Metadata } from "next";
import { getPublicAboutContent } from "@/lib/about";
import { getPageMetadata } from "@/lib/seo";
import { AboutPageClient } from "@/components/about/about-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about");
}

export default async function AboutPage() {
  const content = await getPublicAboutContent();
  return <AboutPageClient content={content} />;
}
