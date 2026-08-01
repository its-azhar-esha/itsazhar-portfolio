"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicBlogPost } from "@/types/blog";
import { formatDate, humanizeCategory, initials, readingTime } from "./post-card";

const SLIDE_MS = 6000;

const slideVariants = {
  enter: (direction: number) => ({ x: direction * 64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -64, opacity: 0 }),
};

function SlideContent({
  post,
  index,
  count,
}: {
  post: PublicBlogPost;
  index: number;
  count: number;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {post.coverImage ? (
        <Image
          src={post.coverImage}
          alt=""
          fill
          priority={index === 0}
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="from-primary/25 absolute inset-0 bg-gradient-to-br via-teal-500/10 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          {post.categories.slice(0, 2).map((c) => (
            <span
              key={c}
              className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm"
            >
              {humanizeCategory(c)}
            </span>
          ))}
          {post.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        <Link href={`/blog/${post.slug}`} className="mt-3 block">
          <h2 className="max-w-2xl text-xl leading-snug font-bold tracking-tight text-white transition-colors hover:text-amber-200 sm:text-2xl md:text-3xl">
            {post.title}
          </h2>
        </Link>
        <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:line-clamp-3 md:text-base">
          {post.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {initials(post.author)}
              </span>
              {post.author || "Azhar"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {readingTime(post.content)}
            </span>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors"
          >
            Read article
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <span className="mt-4 text-[11px] font-medium tracking-widest text-white/50 uppercase">
          {index + 1} / {count}
        </span>
      </div>
    </div>
  );
}

export function PostCarousel({ posts }: { posts: PublicBlogPost[] }) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const count = posts.length;

  const paginate = useCallback(
    (dir: number) => {
      setState(([current]) => [(((current + dir) % count) + count) % count, dir]);
    },
    [count],
  );

  const goTo = useCallback((target: number) => {
    setState(([current]) => [target, target >= current ? 1 : -1]);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => paginate(1), SLIDE_MS);
    return () => clearInterval(id);
  }, [count, paused, paginate]);

  if (count === 0) return null;

  return (
    <section
      aria-label="Latest posts"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-muted relative h-96 overflow-hidden rounded-2xl shadow-xl sm:h-[26rem] md:h-[24rem] lg:h-[26rem]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={posts[index].slug}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <SlideContent post={posts[index]} index={index} count={count} />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => paginate(-1)}
                aria-label="Previous post"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => paginate(1)}
                aria-label="Next post"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute bottom-5 left-6 z-10 flex items-center gap-1.5 sm:left-8">
              {posts.map((post, i) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to post ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
