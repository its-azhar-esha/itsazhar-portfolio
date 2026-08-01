import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCarousel } from "@/components/blog/post-carousel";
import { PostCard, humanizeCategory } from "@/components/blog/post-card";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import { DEFAULT_BLOG_CONTENT, type BlogPageContent } from "@/lib/content/defaults/blog";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("blog");
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, settings, content] = await Promise.all([
    getPublicBlogPostsAction({ category }),
    getPublicSiteSettings(),
    getPublicPageContent<BlogPageContent>("blog", DEFAULT_BLOG_CONTENT),
  ]);

  const allCategories = Array.from(new Set(posts.flatMap((p) => p.categories)));
  const carouselPosts = posts.slice(0, 4);
  const rest = posts.slice(4);

  return (
    <div className="pt-24 md:pt-32">
      {posts.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <PenLine className="text-muted-foreground mx-auto h-12 w-12" />
          <h2 className="mt-4 text-lg font-semibold">{content.empty.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{content.empty.description}</p>
        </div>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6 md:pt-8 lg:px-8">
            <PostCarousel posts={carouselPosts} />
          </section>

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
                  {content.allLabel}
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

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            {rest.length > 0 && (
              <section className="mb-10">
                <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                  {content.moreArticles}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}

            <div className="border-border/40 mt-16 flex flex-col items-center rounded-2xl border py-12 text-center">
              <p className="text-muted-foreground text-sm">{content.cta.title}</p>
              <Link
                href={settings.booking_url || "/contact"}
                data-track="cta_click"
                data-track-label="Blog: Book audit"
              >
                <Button size="lg" className="mt-4 gap-2">
                  {content.cta.button}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
