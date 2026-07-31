import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { PublicBlogPost } from "@/types/blog";

function humanizeCategory(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PostCard({ post, large }: { post: PublicBlogPost; large?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group border-border/50 bg-card hover:border-primary/30 flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg",
      )}
    >
      <div
        className={cn(
          "bg-muted relative overflow-hidden",
          large ? "aspect-[16/8]" : "aspect-video",
        )}
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes={large ? "(min-width: 1024px) 896px, 100vw" : "(min-width: 640px) 33vw, 100vw"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
            <Newspaper className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", large ? "p-6" : "p-5")}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {post.categories.slice(0, 2).map((c) => (
            <span key={c} className="text-primary text-xs font-medium tracking-wide uppercase">
              {humanizeCategory(c)}
            </span>
          ))}
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarDays className="h-3 w-3" />
            {formatDate(post.publishedAt)}
          </span>
        </div>
        <h2
          className={cn(
            "group-hover:text-primary font-semibold tracking-tight transition-colors duration-200",
            large ? "text-2xl" : "text-base",
          )}
        >
          {post.title}
        </h2>
        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-4">
          <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
            Read article
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const title = `Blog | ${settings.site_name || "Azhar"}`;
  return {
    title,
    description:
      settings.site_description ||
      "Insights on AI automation, n8n workflows, AI agents and business process automation.",
    openGraph: { title, type: "website" },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, settings] = await Promise.all([
    getPublicBlogPostsAction({ category }),
    getPublicSiteSettings(),
  ]);

  const allCategories = Array.from(new Set(posts.flatMap((p) => p.categories)));
  const featured = posts.find((p) => p.featured) ?? null;
  const rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <Badge variant="secondary" className="mb-4">
            Blog
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Building authority through automation
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Practical insights on AI agents, n8n workflows and business automation — written from
            real client work, not theory.
          </p>
        </div>
      </header>

      {allCategories.length > 1 && (
        <div className="border-border/40 border-b">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                !category
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary",
              )}
            >
              All
            </Link>
            {allCategories.map((c) => (
              <Link
                key={c}
                href={`/blog?category=${c}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === c
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary",
                )}
              >
                {humanizeCategory(c)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <Newspaper className="text-muted-foreground mx-auto h-12 w-12" />
          <h2 className="mt-4 text-lg font-semibold">No posts yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Check back soon — new articles are on the way.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {featured && (
            <div className="mb-10">
              <PostCard post={featured} large />
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
          <div className="border-border/40 mt-16 flex flex-col items-center rounded-2xl border py-12 text-center">
            <p className="text-muted-foreground text-sm">
              Want these systems working for your business?
            </p>
            <Link href={settings.booking_url || "/contact"}>
              <Button size="lg" className="mt-4 gap-2">
                Book a Free 15-Min Audit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
