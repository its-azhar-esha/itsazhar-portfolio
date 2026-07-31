import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getProject,
  getProjectSlugs,
  getAdjacentProjects,
  getRelatedProjects,
} from "@/lib/projects-data";
import { getPageMetadata } from "@/lib/seo";
import Link from "next/link";

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug: string) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found" };

  const pageSeo = await getPageMetadata("projects");

  const title = project.seo_title
    ? `${project.seo_title} | Azhar`
    : `${project.name} | Azhar | AI Automation Systems`;
  const description = project.seo_description || project.description || pageSeo.description || "";

  return {
    title,
    description,
    keywords: project.keywords?.length ? project.keywords.join(", ") : pageSeo.keywords,
    robots: pageSeo.robots,
    openGraph: {
      title: project.seo_title || `${project.name} | Azhar`,
      description,
      ...(project.coverImage
        ? { images: [{ url: project.coverImage }] }
        : pageSeo.openGraph?.images
          ? { images: pageSeo.openGraph.images }
          : {}),
      ...(project.canonical_url
        ? { url: project.canonical_url }
        : pageSeo.openGraph?.url
          ? { url: pageSeo.openGraph.url }
          : {}),
    },
    alternates: project.canonical_url ? { canonical: project.canonical_url } : undefined,
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const { prev, next } = await getAdjacentProjects(slug);
  const related = await getRelatedProjects(slug);

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              &larr; All Projects
            </Link>
          </div>
          <Badge variant="secondary" className="mb-4 w-fit">
            {project.category}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">{project.longDescription}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {project.challenge && (
        <section className="border-border/40 border-b py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-destructive text-xl font-bold sm:text-2xl">The Challenge</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">{project.challenge}</p>
          </div>
        </section>
      )}

      {project.solution && (
        <section className="border-border/40 border-b py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-primary text-xl font-bold sm:text-2xl">The Solution</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">{project.solution}</p>
          </div>
        </section>
      )}

      {project.workflow && (
        <section className="border-border/40 border-b py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold sm:text-2xl">Workflow</h2>
            <div className="mt-8 space-y-0">
              {project.workflow.map((step, i) => (
                <div key={i} className="relative flex gap-6 pb-8 last:pb-0">
                  {i < (project.workflow?.length || 0) - 1 && (
                    <div className="bg-border absolute top-8 bottom-0 left-[15px] w-0.5" />
                  )}
                  <div className="border-primary bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2">
                    <span className="text-primary text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-muted-foreground pt-1.5 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {project.tech && (
        <section className="border-border/40 border-b py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold sm:text-2xl">Technology Stack</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <Badge key={t} variant="outline" className="px-3 py-1.5 text-sm">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {project.impact && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="border-primary/20 from-card to-background bg-gradient-to-b">
              <CardHeader>
                <CardTitle className="text-xl">Impact & Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.impact}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-border/40 border-t py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold sm:text-2xl">Related Projects</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/projects/${r.slug}`}>
                  <Card className="hover:border-primary/30 h-full transition-all duration-200 hover:shadow-sm">
                    <CardHeader className="p-4">
                      <Badge variant="secondary" className="mb-2 w-fit text-[10px]">
                        {r.category}
                      </Badge>
                      <CardTitle className="text-sm">{r.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-xs">
                        {r.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-border/40 border-t py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/projects/${prev.slug}`}
                className="group text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <div className="text-left">
                  <div className="text-muted-foreground/60 text-xs">Previous</div>
                  <div className="font-medium">{prev.name}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/projects/${next.slug}`}
                className="group text-muted-foreground hover:text-foreground flex items-center gap-2 text-right text-sm transition-colors"
              >
                <div>
                  <div className="text-muted-foreground/60 text-xs">Next</div>
                  <div className="font-medium">{next.name}</div>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      <section className="border-border/40 border-t py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <p className="text-muted-foreground text-sm">
              Interested in a similar system for your business?
            </p>
            <Link href="/contact">
              <Button size="lg" className="mt-4 gap-2">
                Book a Free 15-Min Audit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
