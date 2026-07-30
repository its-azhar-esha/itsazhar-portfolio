import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Features } from "@/components/features";
import { CaseStudies } from "@/components/case-studies";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { CTA } from "@/components/cta";

export const metadata: Metadata = {
  alternates: { canonical: "https://azhar.dev" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Showcase />
      <Features />
      <CaseStudies />
      <About />
      <Contact />
      <CTA />
    </>
  );
}
