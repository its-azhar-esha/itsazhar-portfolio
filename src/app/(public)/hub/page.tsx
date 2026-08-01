import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Boxes, FolderKanban, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HubSearchTracker } from "@/components/analytics/trackers";
import {
  getPublicResourcesAction,
  getPublicCategoriesAction,
  getPublicCollectionsAction,
} from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import { DEFAULT_HUB_CONTENT, type HubPageContent } from "@/lib/content/defaults/hub";
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
  return getPageMetadata("hub");
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

  const [resources, categories, collections, settings, content] = await Promise.all([
    getPublicResourcesAction({
      search: params.search,
      type: params.type,
      category: params.category,
    }),
    getPublicCategoriesAction(),
    getPublicCollectionsAction(),
    getPublicSiteSettings(),
    getPublicPageContent<HubPageContent>("hub", DEFAULT_HUB_CONTENT),
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
              {content.hero.badge}
            </Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.hero.title}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base sm:text-lg">
            {content.hero.intro}
          </p>
          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              <strong className="text-foreground">{resources.length}</strong>{" "}
              {content.stats.resources}
            </span>
            <span>
              <strong className="text-emerald-500">{freeCount}</strong> {content.stats.free}
            </span>
            <span>
              <strong className="text-primary">{paidCount}</strong> {content.stats.paid}
            </span>
            <span>
              <strong className="text-foreground">{totalDownloads.toLocaleString()}</strong>{" "}
              {content.stats.downloads}
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
              {content.filters.allCategories}
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
            <h2 className="mb-4 text-base font-semibold tracking-tight">
              {content.filters.collections}
            </h2>
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
                placeholder={content.filters.searchPlaceholder}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 h-9 w-full rounded-lg border pr-3 pl-9 text-sm focus:outline-none"
              />
            </div>
            <select name="type" defaultValue={params.type ?? ""} className={selectClass}>
              <option value="">{content.filters.allTypes}</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <select name="price" defaultValue={price} className={selectClass}>
              <option value="all">{content.filters.allPrices}</option>
              <option value="free">{content.filters.free}</option>
              <option value="paid">{content.filters.paid}</option>
            </select>
            <select name="sort" defaultValue={sort} className={selectClass}>
              <option value="featured">{content.filters.featured}</option>
              <option value="newest">{content.filters.newest}</option>
              <option value="downloads">{content.filters.mostDownloaded}</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {params.category && (
              <span className="text-muted-foreground text-xs">
                {content.filters.categoryPrefix}{" "}
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
                  {content.filters.clear}
                </Link>
              )}
              <Button type="submit" size="sm" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                {content.filters.search}
              </Button>
            </div>
          </div>
        </form>
        <Suspense fallback={null}>
          <HubSearchTracker />
        </Suspense>

        {visible.length === 0 ? (
          <div className="mx-auto max-w-7xl py-16 text-center">
            <Boxes className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="mt-4 text-lg font-semibold">{content.empty.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {params.search || params.type || params.category || price !== "all"
                ? content.empty.filtered
                : content.empty.comingSoon}
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
              {content.resultsLine
                .replace("{count}", String(visible.length))
                .replace("{total}", String(resources.length))}
            </p>
          </>
        )}

        <div className="border-border/40 mt-14 flex flex-col items-center rounded-2xl border py-12 text-center">
          <p className="text-muted-foreground text-sm">{content.ctaTitle}</p>
          <Link href={settings.booking_url || "/contact"}>
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
