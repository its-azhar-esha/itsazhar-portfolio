import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch, Wand2, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicTemplatesAction, getPublicWorkflowCategoriesAction } from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { TemplateCard } from "@/components/playground/template-card";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Workflow Playground | ${settings.site_name || "Azhar"}`;
  return {
    title,
    description:
      "Visual workflow builder with copy-paste ready automation templates. Build, share and remix automation flows in your browser.",
    openGraph: { title, type: "website" },
  };
}

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const [templates, categories] = await Promise.all([
    getPublicTemplatesAction({
      search: params.search,
      category: params.category,
      difficulty: params.difficulty,
    }),
    getPublicWorkflowCategoriesAction(),
  ]);

  const featured = templates.filter((t) => t.featured).slice(0, 3);
  const rest = templates.filter((t) => !featured.some((f) => f.id === t.id));

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <Badge variant="secondary" className="mb-4">
            Workflow Playground
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Build automation flows, visually
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Drag and drop triggers, AI steps and actions. Start from a ready-made template or build
            from scratch — no code required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/playground/builder">
              <Button size="lg" className="gap-2">
                <Workflow className="h-4 w-4" />
                Open the builder
              </Button>
            </Link>
            <Link href="/playground/builder">
              <Button size="lg" variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Start from a blank canvas
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
              All categories
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
            {featured.length > 0 ? "Featured templates" : "Templates"}
          </h2>
          <form action="/playground" method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="category" value={params.category ?? ""} />
            <select
              name="difficulty"
              defaultValue={params.difficulty ?? ""}
              className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
            >
              <option value="">Any difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search templates..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 h-9 w-56 rounded-lg border px-3 text-sm focus:outline-none"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {templates.length === 0 ? (
          <div className="mx-auto max-w-7xl py-16 text-center">
            <GitBranch className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-semibold">No templates found</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {params.search || params.category || params.difficulty
                ? "Try different filters or search terms."
                : "Templates are on the way — check back soon."}
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
          <p className="text-muted-foreground text-sm">
            Built a workflow you like? Save it and share it with a link — anyone can remix it.
          </p>
          <Link href="/playground/builder">
            <Button size="lg" className="mt-4 gap-2">
              Open the builder
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
