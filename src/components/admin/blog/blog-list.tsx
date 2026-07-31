"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { DbBlogPost } from "@/types/blog";
import {
  deleteBlogPostAction,
  draftBlogPostAction,
  publishBlogPostAction,
} from "@/lib/blog/actions";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface BlogListProps {
  posts: DbBlogPost[];
  error: string | null;
}

export function BlogList({ posts, error }: BlogListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<DbBlogPost | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      posts.filter((post) =>
        searchQuery
          ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
          : true,
      ),
    [posts, searchQuery],
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteBlogPostAction(deleteTarget.id);
    if (!result.success) {
      setDeleteError(result.error);
      return;
    }
    toast.success("Blog post deleted.");
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleToggleStatus(post: DbBlogPost) {
    const result =
      post.status === "published"
        ? await draftBlogPostAction(post.id)
        : await publishBlogPostAction(post.id);
    if (!result.success) {
      setDeleteError(result.error);
    } else {
      toast.success(post.status === "published" ? "Moved to draft." : "Published.");
    }
    router.refresh();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Failed to load blog posts</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">{error}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
          <Newspaper className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-lg font-semibold">No blog posts yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          Write your first post to start building authority through blogging.
        </p>
        <Link href="/admin/blog/new" className="mt-6">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/blog/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-500/30 px-4 py-3 text-sm">
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No posts match your search.</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((post) => (
            <motion.div key={post.id} variants={staggerItem}>
              <Card className="hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{post.title}</h3>
                      {post.featured && (
                        <Badge variant="outline" className="text-primary text-[10px]">
                          Featured
                        </Badge>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                          post.status === "published"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {post.excerpt}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      /blog/{post.slug} · {post.categories.length} categories · {post.tags.length}{" "}
                      tags
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-muted-foreground text-[10px]">Published</p>
                    <p className="text-muted-foreground text-[10px]">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={post.status === "published" ? "Move to draft" : "Publish"}
                      onClick={() => handleToggleStatus(post)}
                    >
                      {post.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/blog/${post.id}/edit`}>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${post.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${post.title}`}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteTarget(post)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="text-muted-foreground text-center text-xs">
        {filtered.length} of {posts.length} posts
      </p>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete blog post"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
