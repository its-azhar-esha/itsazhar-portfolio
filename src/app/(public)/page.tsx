import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Features } from "@/components/features";
import { CaseStudies } from "@/components/case-studies";
import { Testimonials } from "@/components/testimonials";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { CTA } from "@/components/cta";
import { getPublicHeroContent } from "@/lib/hero";
import { getPageMetadata } from "@/lib/seo";
import { getPublicFeaturedServicesAction } from "@/lib/services";
import { getPublicCaseStudiesAction } from "@/lib/case-studies";
import { getPublicTestimonialsAction } from "@/lib/testimonials";
import { getPublicSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home");
}

export default async function Home() {
  const [heroContent, featuredServices, settings, caseStudies, testimonials] = await Promise.all([
    getPublicHeroContent(),
    getPublicFeaturedServicesAction(),
    getPublicSiteSettings(),
    getPublicCaseStudiesAction(),
    getPublicTestimonialsAction(),
  ]);

  return (
    <>
      {settings.show_hero ? <Hero content={heroContent} /> : null}
      {settings.show_showcase ? <Showcase /> : null}
      {settings.show_services ? <Features services={featuredServices} /> : null}
      {settings.show_case_studies ? <CaseStudies studies={caseStudies} /> : null}
      {settings.show_testimonials ? <Testimonials testimonials={testimonials} /> : null}
      {settings.show_about ? <About /> : null}
      {settings.show_contact ? <Contact /> : null}
      <CTA />
    </>
  );
}
