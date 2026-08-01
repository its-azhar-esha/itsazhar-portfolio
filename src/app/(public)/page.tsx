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
import { getPublicPageContent } from "@/lib/content";
import { DEFAULT_HOME_CONTENT, type HomePageContent } from "@/lib/content/defaults/home";
import {
  DEFAULT_PROJECTS_CONTENT,
  type ProjectsPageContent,
} from "@/lib/content/defaults/projects";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home");
}

export default async function Home() {
  const [
    heroContent,
    featuredServices,
    settings,
    caseStudies,
    testimonials,
    homeContent,
    projectsContent,
  ] = await Promise.all([
    getPublicHeroContent(),
    getPublicFeaturedServicesAction(),
    getPublicSiteSettings(),
    getPublicCaseStudiesAction(),
    getPublicTestimonialsAction(),
    getPublicPageContent<HomePageContent>("home", DEFAULT_HOME_CONTENT),
    getPublicPageContent<ProjectsPageContent>("projects", DEFAULT_PROJECTS_CONTENT),
  ]);

  return (
    <>
      {settings.show_hero ? <Hero content={heroContent} /> : null}
      {settings.show_showcase ? (
        <Showcase copy={homeContent.showcase} detail={projectsContent.detail} />
      ) : null}
      {settings.show_services ? (
        <Features services={featuredServices} copy={homeContent.features} />
      ) : null}
      {settings.show_case_studies ? (
        <CaseStudies studies={caseStudies} copy={homeContent.caseStudies} />
      ) : null}
      {settings.show_testimonials ? (
        <Testimonials testimonials={testimonials} copy={homeContent.testimonials} />
      ) : null}
      {settings.show_about ? <About copy={homeContent.about} /> : null}
      {settings.show_contact ? <Contact copy={homeContent.contact} settings={settings} /> : null}
      <CTA copy={homeContent.cta} />
    </>
  );
}
