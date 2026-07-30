import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/lib/projects";
import Link from "next/link";

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.name} | Azhar | AI Automation Systems`,
    description: project.description,
    openGraph: {
      title: `${project.name} | Azhar`,
      description: project.description,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

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
            <div className="mt-10">
              <Button size="lg" className="gap-2">
                Book a Free 15-Min Audit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
