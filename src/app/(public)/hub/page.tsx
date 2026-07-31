import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, FolderKanban, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getPublicResourcesAction,
  getPublicCategoriesAction,
  getPublicCollectionsAction,
} from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/constants/hub";
import type { PublicResource, PublicCollection } from "@/types/hub";
import { ResourceCard } from "@/components/hub/resource-card";

type SortKey = "featured" | "newest" | "downloads";
type PriceFilter = "all" | "free" | "paid";

function sortResources(resources: PublicResource[], sort: SortKey): PublicResource[] {
  const sorted = [...resources];
  if (sort === "newest") {
    sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (sort === "downloads") {
    sorted.sort((a, b) => b.downloads_count - a.downloads_count);
  } else {
    sorted.sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        a.display_order - b.display_order ||
        b.downloads_count - a.downloads_count,
    );
  }
  return sorted;
}

function CollectionCard({ collection }: { collection: PublicCollection }) {
  const first = collection.items[0] ?? null;
  return (
    <Link
      href={first ? `/hub/${first.slug}` : "/hub"}
      className="group border-border/50 bg-card hover:border-primary/30 relative flex h-full min-h-[150px] flex-col justify-end overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-lg"
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
        <div className="mb-1.5 flex items-center gap-1.5">
          <FolderKanban className="text-primary h-3.5 w-3.5" />
          <span className="text-muted-foreground text-[11px]">
            {collection.items.length} item{collection.items.length === 1 ? "" : "s"}
          </span>
        </div>
        <h3 className="text-base font-semibold text-white drop-shadow-md">{collection.name}</h3>
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
  searchParams: Promise<{
    search?: string;
    type?: string;
    category?: string;
    price?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const price: PriceFilter =
    params.price === "free" || params.price === "paid" ? params.price : "all";
  const sort: SortKey =
    params.sort === "newest" || params.sort === "downloads" ? params.sort : "featured";

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

  const filtered = resources.filter((r) => {
    if (price === "free") return r.pricing.model === "free";
    if (price === "paid") return r.pricing.model !== "free";
    return true;
  });
  const visible = sortResources(filtered, sort);

  const freeCount = resources.filter((r) => r.pricing.model === "free").length;
  const paidCount = resources.length - freeCount;
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads_count, 0);

  const selectClass =
    "border-border bg-background text-foreground focus:border-primary/40 h-9 rounded-lg border px-3 text-sm focus:outline-none";

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              Automation Hub
            </Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Browse tools, agents &amp; templates
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base sm:text-lg">
            Tested in real client work. Free to copy, adapt and ship — or grab the premium versions
            that save you hours.
          </p>
          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              <strong className="text-foreground">{resources.length}</strong> resources
            </span>
            <span>
              <strong className="text-emerald-500">{freeCount}</strong> free
            </span>
            <span>
              <strong className="text-primary">{paidCount}</strong> paid
            </span>
            <span>
              <strong className="text-foreground">{totalDownloads.toLocaleString()}</strong>{" "}
              downloads
            </span>
          </div>
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
                href={`/hub?category=${c.id}${params.price ? `&price=${params.price}` : ""}${params.sort ? `&sort=${params.sort}` : ""}`}
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

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {collections.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-base font-semibold tracking-tight">Collections</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
        )}

        <form
          action="/hub"
          method="get"
          className="border-border/60 bg-card mb-8 rounded-xl border p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search templates, agents, prompts…"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 h-9 w-full rounded-lg border pr-3 pl-9 text-sm focus:outline-none"
              />
            </div>
            <select name="type" defaultValue={params.type ?? ""} className={selectClass}>
              <option value="">All types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <select name="price" defaultValue={price} className={selectClass}>
              <option value="all">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <select name="sort" defaultValue={sort} className={selectClass}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="downloads">Most downloaded</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {params.category && (
              <span className="text-muted-foreground text-xs">
                Category:{" "}
                {categories.find((c) => c.id === params.category)?.name ?? params.category}
              </span>
            )}
            <div className="flex items-center gap-2">
              {(params.search ||
                params.type ||
                params.price !== "all" ||
                params.sort !== "featured") && (
                <Link
                  href="/hub"
                  className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Clear filters
                </Link>
              )}
              <Button type="submit" size="sm" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Search
              </Button>
            </div>
          </div>
        </form>

        {visible.length === 0 ? (
          <div className="mx-auto max-w-7xl py-16 text-center">
            <Boxes className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-semibold">No resources found</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {params.search || params.type || params.category || price !== "all"
                ? "Try different filters or search terms."
                : "Resources are on the way — check back soon."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
            <p className="text-muted-foreground mt-8 text-center text-xs">
              {visible.length} of {resources.length} resource{resources.length === 1 ? "" : "s"}
            </p>
          </>
        )}

        <div className="border-border/40 mt-14 flex flex-col items-center rounded-2xl border py-12 text-center">
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
