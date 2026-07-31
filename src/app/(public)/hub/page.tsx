import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Download, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getPublicResourcesAction,
  getPublicCategoriesAction,
  getPublicCollectionsAction,
} from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPE_LABELS } from "@/constants/hub";
import type { PublicResource, PublicCollection } from "@/types/hub";

function ResourceCard({ resource }: { resource: PublicResource }) {
  return (
    <Link
      href={`/hub/${resource.slug}`}
      className="group border-border/50 bg-card hover:border-primary/30 flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg"
    >
      <div className="bg-muted relative aspect-video overflow-hidden">
        {resource.coverUrl ? (
          <Image
            src={resource.coverUrl}
            alt={resource.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
            <Boxes className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-primary text-xs font-medium tracking-wide uppercase">
            {RESOURCE_TYPE_LABELS[resource.type]}
          </span>
          {resource.category && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{resource.category.name}</span>
            </>
          )}
          {resource.access_level === "premium" && (
            <span className="text-primary border-primary/30 bg-primary/10 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">
              Premium
            </span>
          )}
        </div>
        <h2 className="group-hover:text-primary text-base font-semibold tracking-tight transition-colors duration-200">
          {resource.title}
        </h2>
        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
          {resource.summary}
        </p>
        <div className="mt-auto pt-4">
          <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
            {resource.files.length > 0 ? (
              <>
                <Download className="h-3.5 w-3.5" />
                {resource.files.length > 1 ? `${resource.files.length} files` : "Download"}
              </>
            ) : (
              "View resource"
            )}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CollectionCard({ collection }: { collection: PublicCollection }) {
  const first = collection.items[0] ?? null;
  return (
    <Link
      href={first ? `/hub/${first.slug}` : "/hub"}
      className="group border-border/50 bg-card hover:border-primary/30 relative flex h-full min-h-[180px] flex-col justify-end overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-lg"
    >
      {collection.coverUrl ? (
        <Image
          src={collection.coverUrl}
          alt={collection.name}
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="bg-muted absolute inset-0">
          <div className="bg-primary/10 absolute inset-0" />
        </div>
      )}
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <FolderKanban className="text-primary h-4 w-4" />
          <span className="text-muted-foreground text-xs">
            {collection.items.length} resource{collection.items.length === 1 ? "" : "s"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-white drop-shadow-md">{collection.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-white/80 drop-shadow-md">
          {collection.description}
        </p>
      </div>
    </Link>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Automation Hub | ${settings.site_name || "Azhar"}`;
  return {
    title,
    description:
      "Free templates, AI agents, prompts and tools for business automation. Copy, adapt and ship.",
    openGraph: { title, type: "website" },
  };
}

export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [resources, categories, collections, settings] = await Promise.all([
    getPublicResourcesAction({
      search: params.search,
      type: params.type,
      category: params.category,
    }),
    getPublicCategoriesAction(),
    getPublicCollectionsAction(),
    getPublicSiteSettings(),
  ]);

  const featured = resources.filter((r) => r.featured).slice(0, 3);
  const rest = resources.filter((r) => !featured.some((f) => f.id === r.id));

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <Badge variant="secondary" className="mb-4">
            Automation Hub
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Free tools to automate your business
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Templates, AI agents, prompts and guides — tested in real client work, free to copy and
            adapt.
          </p>
        </div>
      </header>

      {categories.length > 0 && (
        <div className="border-border/40 border-b">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/hub"
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
                href={`/hub?category=${c.id}`}
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
        {collections.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-5 text-lg font-semibold tracking-tight">Collections</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {featured.length > 0 ? "Featured" : "All resources"}
          </h2>
          <form action="/hub" method="get" className="flex items-center gap-2">
            <input type="hidden" name="type" value={params.type ?? ""} />
            <input type="hidden" name="category" value={params.category ?? ""} />
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search resources..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 h-9 w-56 rounded-lg border px-3 text-sm focus:outline-none"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {resources.length === 0 ? (
          <div className="mx-auto max-w-7xl py-16 text-center">
            <Boxes className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-semibold">No resources found</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {params.search || params.type || params.category
                ? "Try different filters or search terms."
                : "Resources are on the way — check back soon."}
            </p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
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
                {rest.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
            {resources.length > 0 && (
              <p className="text-muted-foreground mt-8 text-center text-xs">
                {resources.length} resource{resources.length === 1 ? "" : "s"} ·{" "}
                {resources.reduce((sum, r) => sum + r.files.length, 0)} downloadable file
                {resources.reduce((sum, r) => sum + r.files.length, 0) === 1 ? "" : "s"} ·{" "}
                {resources.reduce((sum, r) => sum + r.downloads_count, 0)} downloads
              </p>
            )}
          </>
        )}

        <div className="border-border/40 mt-16 flex flex-col items-center rounded-2xl border py-12 text-center">
          <p className="text-muted-foreground text-sm">
            Want a custom automation built around your exact workflow?
          </p>
          <Link href={settings.booking_url || "/contact"}>
            <Button size="lg" className="mt-4 gap-2">
              Book a Free 15-Min Audit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
