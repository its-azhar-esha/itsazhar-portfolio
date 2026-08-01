import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch, Wand2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicTemplatesAction, getPublicWorkflowCategoriesAction } from "@/lib/hub/actions";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import {
  DEFAULT_PLAYGROUND_CONTENT,
  type PlaygroundPageContent,
} from "@/lib/content/defaults/playground";
import { cn } from "@/lib/utils";
import { TemplateCard } from "@/components/playground/template-card";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("playground");
}

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const [templates, categories, content] = await Promise.all([
    getPublicTemplatesAction({
      search: params.search,
      category: params.category,
      difficulty: params.difficulty,
    }),
    getPublicWorkflowCategoriesAction(),
    getPublicPageContent<PlaygroundPageContent>("playground", DEFAULT_PLAYGROUND_CONTENT),
  ]);

  const featured = templates.filter((t) => t.featured).slice(0, 3);
  const rest = templates.filter((t) => !featured.some((f) => f.id === t.id));

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <Badge variant="secondary" className="mb-4">
            {content.hero.badge}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.hero.title}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{content.hero.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/playground/builder">
              <Button size="lg" className="gap-2">
                <Workflow className="h-4 w-4" />
                {content.hero.openBuilder}
              </Button>
            </Link>
            <Link href="/playground/builder">
              <Button size="lg" variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                {content.hero.blankCanvas}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {categories.length > 0 && (
        <div className="border-border/40 border-b">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/playground"
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                !params.category
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary",
              )}
            >
              {content.filters.allCategories}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/playground?category=${c.id}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  params.category === c.id
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary",
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {featured.length > 0 ? content.sections.featured : content.sections.all}
          </h2>
          <form action="/playground" method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="category" value={params.category ?? ""} />
            <select
              name="difficulty"
              defaultValue={params.difficulty ?? ""}
              className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
            >
              <option value="">{content.difficulty.any}</option>
              <option value="beginner">{content.difficulty.beginner}</option>
              <option value="intermediate">{content.difficulty.intermediate}</option>
              <option value="advanced">{content.difficulty.advanced}</option>
            </select>
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder={content.filters.searchPlaceholder}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 h-9 w-56 rounded-lg border px-3 text-sm focus:outline-none"
            />
            <Button type="submit" size="sm" variant="outline">
              {content.filters.search}
            </Button>
          </form>
        </div>

        {templates.length === 0 ? (
          <div className="mx-auto max-w-7xl py-16 text-center">
            <GitBranch className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-semibold">{content.empty.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {params.search || params.category || params.difficulty
                ? content.empty.filtered
                : content.empty.comingSoon}
            </p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div
                className={cn(
                  "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
                  featured.length > 0 && "mt-6",
                )}
              >
                {rest.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="border-border/40 mt-16 flex flex-col items-center rounded-2xl border py-12 text-center">
          <p className="text-muted-foreground text-sm">{content.ctaTitle}</p>
          <Link href="/playground/builder">
            <Button size="lg" className="mt-4 gap-2">
              {content.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
