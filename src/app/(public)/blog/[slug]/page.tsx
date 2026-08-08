import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/blog/copy-link-button";
import { PostCard } from "@/components/blog/post-card";
import { renderMarkdown } from "@/lib/markdown";
import { getPublicBlogPostAction, getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicPageContent } from "@/lib/content";
import { DEFAULT_BLOG_CONTENT, type BlogPageContent } from "@/lib/content/defaults/blog";
import { getPublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site/urls";
import type { PublicBlogPost } from "@/types/blog";

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function rankRelated(current: PublicBlogPost, all: PublicBlogPost[]): PublicBlogPost[] {
  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({
      post: p,
      score:
        p.categories.filter((c) => current.categories.includes(c)).length * 2 +
        p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.post)
    .slice(0, 3);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts, content] = await Promise.all([
    getPublicBlogPostAction(slug),
    getPublicBlogPostsAction(),
    getPublicPageContent<BlogPageContent>("blog", DEFAULT_BLOG_CONTENT),
  ]);
  if (!post) notFound();

  const related = rankRelated(post, allPosts);
  const readTime = estimateReadTime(post.content);
  const siteUrl = await getSiteUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const shareText = encodeURIComponent(`${post.title} — by ${post.author}`);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author || "Azhar Mahmud",
      alternateName: "Azhar (ItsAzhar)",
      url: siteUrl,
      jobTitle: "AI Automation Expert",
    },
    publisher: {
      "@type": "Organization",
      name: "ItsAzhar",
      url: siteUrl,
    },
    mainEntityOfPage: postUrl,
    keywords: post.keywords.length ? post.keywords.join(", ") : undefined,
  };

  return (
    <article className="pt-24 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="border-border/40 relative overflow-hidden border-b">
        <div className="from-primary/15 pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r via-transparent to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mb-6">
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {content.detail.back}
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">
                {initials(post.author)}
              </span>
              <div>
                <p className="text-sm font-semibold">{post.author}</p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    {readTime} {content.detail.minRead}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              >
                <span className="text-xs font-bold">𝕏</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              >
                <span className="text-xs font-bold">in</span>
              </a>
              <CopyLinkButton url={postUrl} />
            </div>
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

        {post.sources.length > 0 && (
          <div className="mt-10">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Sources
            </h2>
            <ol className="mt-4 space-y-2">
              {post.sources.map((source, index) => (
                <li key={index}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 group flex items-start gap-2 text-sm font-medium transition-colors"
                  >
                    <span className="text-muted-foreground group-hover:text-primary/80 font-normal transition-colors">
                      {index + 1}.
                    </span>
                    <span className="break-all">{source.title}</span>
                    <ExternalLink className="text-muted-foreground group-hover:text-primary/80 mt-0.5 h-3 w-3 shrink-0 transition-colors" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="border-border/60 bg-card mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary/15 text-primary flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold">
              {initials(post.author)}
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase">
                {content.detail.writtenBy}
              </p>
              <p className="font-semibold">{post.author || "Azhar"}</p>
              <p className="text-muted-foreground text-xs">{content.detail.authorBio}</p>
            </div>
          </div>
          <Link href="/contact" data-track="cta_click" data-track-label="Blog author: Get in touch">
            <Button variant="outline" size="sm" className="gap-1.5">
              {content.detail.getInTouch} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {related.length > 0 && (
          <div className="border-border/40 mt-14 border-t pt-12">
            <h2 className="text-2xl font-bold tracking-tight">{content.detail.keepReading}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{content.detail.moreSubtitle}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}

        <div className="border-border/40 border-t py-14 md:py-20">
          <div className="flex flex-col items-center text-center">
            <p className="text-muted-foreground text-sm">{content.detail.ctaTitle}</p>
            <Link href="/contact" data-track="cta_click" data-track-label="Blog: Book audit">
              <Button size="lg" className="mt-4 gap-2">
                {content.detail.ctaButton}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
