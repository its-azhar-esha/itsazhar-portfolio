import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Eye, GitBranch, ListOrdered, Play, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicTemplateAction } from "@/lib/hub/actions";
import { getPublicPageContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site/urls";
import {
  DEFAULT_PLAYGROUND_CONTENT,
  type PlaygroundPageContent,
} from "@/lib/content/defaults/playground";
import { DIFFICULTY_LABELS } from "@/constants/hub";

interface TemplateDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getPublicTemplateAction(slug);
  if (!template) return {};
  const baseUrl = await getSiteUrl();
  const title = template.seo_title || `${template.title} — Workflow Template`;
  const description = template.seo_description || template.description;
  const canonical = `${baseUrl}/playground/template/${slug}`;
  return {
    title,
    description,
    keywords: template.keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const template = await getPublicTemplateAction(slug);
  if (!template) notFound();

  const [content] = await Promise.all([
    getPublicPageContent<PlaygroundPageContent>("playground", DEFAULT_PLAYGROUND_CONTENT),
  ]);

  const nodeCount = new Map<string, number>();
  for (const node of template.nodes) {
    nodeCount.set(node.type, (nodeCount.get(node.type) ?? 0) + 1);
  }
  const nodeNames = new Map(template.nodes.map((n) => [n.type, n.label ?? n.type] as const));

  return (
    <div className="pt-24 md:pt-32">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/playground" className="text-muted-foreground hover:text-primary text-sm">
          {content.template.back}
        </Link>

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {template.category && <Badge variant="secondary">{template.category.name}</Badge>}
            <Badge variant="outline">{DIFFICULTY_LABELS[template.difficulty]}</Badge>
            {template.featured && <Badge>Featured</Badge>}
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{template.title}</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl text-lg leading-relaxed">
            {template.description}
          </p>
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {template.views_count.toLocaleString()} {content.template.views}
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-4 w-4" />
              {template.nodes.length} {content.template.stats.split(" · ")[0]} ·{" "}
              {template.edges.length} {content.template.stats.split(" · ")[1]}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(template.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/playground/builder?t=${template.slug}`}>
              <Button size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                {content.template.use}
              </Button>
            </Link>
            <Link href="/playground/builder">
              <Button size="lg" variant="outline" className="gap-2">
                <Workflow className="h-4 w-4" />
                {content.template.blank}
              </Button>
            </Link>
          </div>
        </div>

        {template.walkthrough.length > 0 && (
          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <ListOrdered className="h-5 w-5" />
              {content.template.howItWorks}
            </h2>
            <ol className="mt-5 space-y-4">
              {template.walkthrough.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <GitBranch className="h-5 w-5" />
            What&apos;s inside
          </h2>
          <div className="border-border/60 bg-card mt-5 grid gap-4 rounded-xl border p-6 sm:grid-cols-2">
            {Array.from(nodeCount.entries()).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{nodeNames.get(type) ?? type}</span>
                <span className="text-muted-foreground">
                  {count} node{count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
            {template.nodes.length === 0 && (
              <p className="text-muted-foreground text-sm">This template is empty.</p>
            )}
          </div>
        </section>

        <div className="border-border/40 mt-14 flex flex-col items-center rounded-2xl border py-10 text-center">
          <p className="text-muted-foreground text-sm">{content.template.ctaTitle}</p>
          <Link href="/contact">
            <Button variant="outline" className="mt-4 gap-2">
              {content.template.ctaButton} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
