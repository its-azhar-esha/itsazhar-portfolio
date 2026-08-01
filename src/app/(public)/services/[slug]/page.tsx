import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicServiceAction, getPublicServiceSlugsAction } from "@/lib/services";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import {
  DEFAULT_SERVICES_CONTENT,
  type ServicesPageContent,
} from "@/lib/content/defaults/services";
import { SERVICE_ICONS } from "@/constants/services";

export async function generateStaticParams() {
  const slugs = await getPublicServiceSlugsAction();
  return slugs.map((slug: string) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceAction(slug);
  if (!service) return { title: "Service Not Found" };

  const pageSeo = await getPageMetadata("services");

  const title = service.seo_title
    ? `${service.seo_title} | Azhar`
    : `${service.title} | Azhar | AI Automation Services`;
  const description =
    service.seo_description || service.short_description || pageSeo.description || "";

  return {
    title,
    description,
    keywords: service.seo_keywords?.length ? service.seo_keywords.join(", ") : pageSeo.keywords,
    robots: pageSeo.robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(pageSeo.openGraph?.url ? { url: `${pageSeo.openGraph.url}/${slug}` } : {}),
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, content] = await Promise.all([
    getPublicServiceAction(slug),
    getPublicPageContent<ServicesPageContent>("services", DEFAULT_SERVICES_CONTENT),
  ]);
  if (!service) notFound();

  const Icon = SERVICE_ICONS[service.icon] ?? SERVICE_ICONS.bot;
  const highlights = service.content?.highlights ?? [];

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/services"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {content.detail.back}
            </Link>
          </div>
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-xl">
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {service.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {service.short_description}
          </p>
        </div>
      </section>

      {highlights.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold sm:text-2xl">{content.detail.included}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <Card
                  key={highlight}
                  className="border-border/40 hover:border-primary/30 transition-all duration-200"
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="bg-primary/10 text-primary mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <p className="text-muted-foreground text-sm leading-relaxed">{highlight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-border/40 border-t py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {content.detail.badge}
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {content.detail.ctaTitle}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-relaxed">
              {content.detail.ctaDescription}
            </p>
            <Link href="/contact" className="mt-8">
              <Button size="lg" className="gap-2">
                {content.detail.ctaButton}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
