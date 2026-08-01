import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Feather, PenLine, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCarousel } from "@/components/blog/post-carousel";
import { PostCard, humanizeCategory } from "@/components/blog/post-card";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

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
  const carouselPosts = posts.slice(0, 4);
  const rest = posts.slice(4);

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
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" />
              <h2 className="text-lg font-semibold">Latest posts</h2>
            </div>
            <PostCarousel posts={carouselPosts} />
          </section>

          {rest.length > 0 && (
            <section className="mb-10">
              <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                More articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
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
