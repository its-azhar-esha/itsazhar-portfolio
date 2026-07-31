import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Feather,
  Newspaper,
  PenLine,
  Sparkles,
} from "lucide-react";
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

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CategoryPills({ categories }: { categories: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.slice(0, 2).map((c) => (
        <span
          key={c}
          className="text-primary bg-primary/10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
        >
          {humanizeCategory(c)}
        </span>
      ))}
    </div>
  );
}

function MetaRow({ post }: { post: PublicBlogPost }) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      <span className="flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {formatDate(post.publishedAt)}
      </span>
      <span className="flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {readingTime(post.content)}
      </span>
    </div>
  );
}

function AuthorRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary/15 text-primary flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold">
        {initials(name)}
      </span>
      <span className="text-xs font-medium">{name}</span>
    </div>
  );
}

function PostCard({ post, large }: { post: PublicBlogPost; large?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group border-border/50 bg-card hover:border-primary/30 flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
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
          <div className="from-primary/15 flex h-full w-full items-center justify-center bg-gradient-to-br to-teal-500/10">
            <Newspaper className="text-primary/60 h-10 w-10" />
          </div>
        )}
        {post.featured && (
          <span className="bg-primary text-primary-foreground absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md">
            <Sparkles className="h-3 w-3" />
            Featured
          </span>
        )}
        {large && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", large ? "p-6" : "p-5")}>
        <div className={cn("mb-2.5 flex flex-wrap items-center gap-2", large && "gap-3")}>
          <CategoryPills categories={post.categories} />
          <MetaRow post={post} />
        </div>
        <h2
          className={cn(
            "group-hover:text-primary font-semibold tracking-tight transition-colors duration-200",
            large ? "text-2xl leading-snug" : "line-clamp-2 text-base leading-snug",
          )}
        >
          {post.title}
        </h2>
        <p
          className={cn(
            "text-muted-foreground mt-2 leading-relaxed",
            large ? "line-clamp-3 text-sm" : "line-clamp-2 text-sm",
          )}
        >
          {post.excerpt}
        </p>
        <div className={cn("mt-auto flex items-center justify-between", large ? "pt-5" : "pt-4")}>
          <AuthorRow name={post.author || "Azhar"} />
          <span className="text-primary flex items-center gap-1 text-sm font-medium">
            Read
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

  const totalWords = posts.reduce((sum, p) => sum + p.content.trim().split(/\s+/).length, 0);

  return (
    <div className="pt-24 md:pt-32">
      <header className="border-border/40 relative overflow-hidden border-b">
        <div className="from-primary/15 pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r via-transparent to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <Badge variant="secondary" className="gap-1.5">
            <Feather className="h-3 w-3" />
            Blog
          </Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Building authority through automation
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
            Practical insights on AI agents, n8n workflows and business automation — written from
            real client work, not theory.
          </p>
          {posts.length > 0 && (
            <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                <strong className="text-foreground">{posts.length}</strong> articles
              </span>
              <span>
                <strong className="text-foreground">
                  {Math.max(1, Math.round(totalWords / 200))}
                </strong>{" "}
                minutes of reading
              </span>
              <span>
                <strong className="text-foreground">{allCategories.length}</strong> topics
              </span>
            </div>
          )}
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
          <PenLine className="text-muted-foreground mx-auto h-12 w-12" />
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
