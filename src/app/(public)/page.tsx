import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Features } from "@/components/features";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { CTA } from "@/components/cta";
import { getPublicHeroContent } from "@/lib/hero";
import { getPageMetadata } from "@/lib/seo";
import { getPublicFeaturedServicesAction } from "@/lib/services";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home");
}

export default async function Home() {
  const heroContent = await getPublicHeroContent();
  const featuredServices = await getPublicFeaturedServicesAction();

  return (
    <>
      <Hero content={heroContent} />
      <Showcase />
      <Features services={featuredServices} />
      <CaseStudies />
      <About />
      <Contact />
      <CTA />
    </>
  );
}
