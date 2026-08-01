import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicServicesAction } from "@/lib/services";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import {
  DEFAULT_SERVICES_CONTENT,
  type ServicesPageContent,
} from "@/lib/content/defaults/services";
import { SERVICE_ICONS } from "@/constants/services";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("services");
}

export default async function ServicesPage() {
  const [services, content] = await Promise.all([
    getPublicServicesAction(),
    getPublicPageContent<ServicesPageContent>("services", DEFAULT_SERVICES_CONTENT),
  ]);

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {content.hero.badge}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {content.hero.title}
            </h1>
            <p className="text-muted-foreground mt-6 text-lg">{content.hero.intro}</p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {services.length === 0 ? (
            <div className="mx-auto max-w-lg py-20 text-center">
              <p className="text-muted-foreground text-sm">{content.emptyMessage}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = SERVICE_ICONS[service.icon] ?? SERVICE_ICONS.bot;
                return (
                  <Link key={service.slug} href={`/services/${service.slug}`} className="group">
                    <Card className="hover:border-primary/30 hover:shadow-primary/5 h-full transition-all duration-300 hover:shadow-lg">
                      <CardHeader>
                        <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {service.short_description}
                        </p>
                        <span className="group/cta text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                          <span className="relative">
                            {content.learnMore}
                            <span className="bg-primary absolute -bottom-0.5 left-0 h-px w-0 rounded-full transition-all duration-200 group-hover/cta:w-full" />
                          </span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-16 flex justify-center">
            <Link href="/contact">
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
