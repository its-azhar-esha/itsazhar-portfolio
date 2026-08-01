import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicBlogPost } from "@/types/blog";

export function humanizeCategory(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CategoryPills({ categories }: { categories: string[] }) {
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

export function MetaRow({ post }: { post: PublicBlogPost }) {
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

export function AuthorRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary/15 text-primary flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold">
        {initials(name)}
      </span>
      <span className="text-xs font-medium">{name}</span>
    </div>
  );
}

export function PostCard({ post, large }: { post: PublicBlogPost; large?: boolean }) {
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
