import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Features } from "@/components/features";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { CTA } from "@/components/cta";
import { getPublicHeroContent } from "@/lib/hero";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const content = await getPublicHeroContent();
    return {
      title: content.seo.title,
      description: content.seo.description,
      alternates: { canonical: "https://azhar.dev" },
    };
  } catch {
    return {
      alternates: { canonical: "https://azhar.dev" },
    };
  }
}

export default async function Home() {
  const heroContent = await getPublicHeroContent();

  return (
    <>
      <Hero content={heroContent} />
      <Showcase />
      <Features />
      <CaseStudies />
      <About />
      <Contact />
      <CTA />
    </>
  );
}
