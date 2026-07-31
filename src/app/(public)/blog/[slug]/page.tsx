import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/blog/markdown";
import { getPublicBlogPostAction } from "@/lib/blog/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

function humanizeCategory(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostAction(slug);
  if (!post) return { title: "Post Not Found" };
  const settings = await getPublicSiteSettings();

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;

  return {
    title,
    description: description || undefined,
    keywords: post.keywords.length ? post.keywords.join(", ") : undefined,
    alternates: post.canonicalUrl
      ? { canonical: post.canonicalUrl }
      : { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description: description || undefined,
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      siteName: settings.site_name || "Azhar",
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicBlogPostAction(slug);
  if (!post) notFound();

  const readTime = estimateReadTime(post.content);

  return (
    <article className="pt-24 md:pt-32">
      <header className="border-border/40 border-b">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-6">
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              &larr; All Posts
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link key={category} href={`/blog?category=${category}`}>
                <Badge variant="secondary" className="transition-colors hover:opacity-80">
                  {humanizeCategory(category)}
                </Badge>
              </Link>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{post.excerpt}</p>
          )}

          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="border-border/40 border-b">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative -mb-10 aspect-[2/1] overflow-hidden rounded-2xl shadow-xl md:-mb-16">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(min-width: 1024px) 896px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className={cn("prose-invert", post.coverImage ? "pt-24 md:pt-32" : "pt-12 md:pt-16")}>
          {renderMarkdown(post.content)}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag.replace(/\s+/g, "-")}
              </Badge>
            ))}
          </div>
        )}

        <div className="border-border/40 border-t py-14 md:py-20">
          <div className="flex flex-col items-center text-center">
            <p className="text-muted-foreground text-sm">
              Want systems like the ones I write about, built for your business?
            </p>
            <Link href="/contact">
              <Button size="lg" className="mt-4 gap-2">
                Book a Free 15-Min Audit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
