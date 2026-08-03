"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createBlogPostSchema, updateBlogPostSchema } from "@/lib/validation";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "./repository";
import type {
  DbBlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  PublicBlogPost,
} from "@/types/blog";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { MOCK_BLOG_POSTS, toPublicBlogPost } from "./mock-data";
import { rowToDbBlogPost } from "./repository";
import { resolveMediaValue, resolveMediaValues } from "@/lib/media/repository";
import { notify } from "@/lib/notifications/sender";

const TABLE = "blog_posts" as const;

function revalidateBlogPaths(slug?: string): void {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function createBlogPostAction(
  input: Record<string, unknown>,
): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createBlogPostSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createBlogPost(parsed.data as CreateBlogPostInput, user.id);
    if (result.success) {
      revalidateBlogPaths(parsed.data.slug);
      await logAudit({
        action: "blog.created",
        entity: "blog_posts",
        entityId: result.data.id,
        detail: { slug: result.data.slug },
      });
      await notify("blog.created", {
        fields: { Slug: result.data.slug, Status: result.data.status ?? "draft" },
      });
    }
    return result;
  } catch (err) {
    logError("createBlogPostAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create blog post");
  }
}

export async function updateBlogPostAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateBlogPostSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateBlogPost(id, parsed.data as UpdateBlogPostInput, user.id);
    if (result.success) {
      revalidateBlogPaths(parsed.data.slug);
      await logAudit({
        action: "blog.updated",
        entity: "blog_posts",
        entityId: id,
        detail: { slug: result.data.slug },
      });
      await notify("blog.updated", {
        fields: { Slug: result.data.slug, Status: result.data.status ?? "draft" },
      });
    }
    return result;
  } catch (err) {
    logError("updateBlogPostAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update blog post");
  }
}

export async function deleteBlogPostAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteBlogPost(id, user.id);
    if (result.success) {
      revalidateBlogPaths();
      await logAudit({ action: "blog.deleted", entity: "blog_posts", entityId: id });
      await notify("blog.deleted", { fields: { BlogId: id } });
    }
    return result;
  } catch (err) {
    logError("deleteBlogPostAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete blog post");
  }
}

export async function publishBlogPostAction(id: string): Promise<Result<DbBlogPost>> {
  return updateBlogPostAction(id, { status: "published" });
}

export async function draftBlogPostAction(id: string): Promise<Result<DbBlogPost>> {
  return updateBlogPostAction(id, { status: "draft" });
}

/* ─── Public read server actions ─── */

function publicFromDb(post: DbBlogPost): PublicBlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.cover_image,
    categories: post.categories,
    tags: post.tags,
    author: post.author,
    featured: post.featured,
    publishedAt: post.published_at ?? post.created_at,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    ogImage: post.og_image,
    canonicalUrl: post.canonical_url,
    keywords: post.keywords,
  };
}

export async function getPublicBlogPostsAction(
  filter: { category?: string } = {},
): Promise<PublicBlogPost[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from(TABLE)
      .select("*")
      .eq("status", "published")
      .or("scheduled_for.is.null,scheduled_for.lte.now");
    if (filter.category) query = query.contains("categories", [filter.category]);
    const { data, error } = await query
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      return MOCK_BLOG_POSTS.filter((p) => p.status === "published")
        .filter((p) => !filter.category || p.categories.includes(filter.category))
        .map(toPublicBlogPost);
    }
    const posts = data.map(rowToDbBlogPost).map(publicFromDb);
    const covers = await resolveMediaValues(posts.map((p) => p.coverImage));
    const ogs = await resolveMediaValues(posts.map((p) => p.ogImage));
    return posts.map((p, i) => ({ ...p, coverImage: covers[i], ogImage: ogs[i] }));
  } catch {
    return MOCK_BLOG_POSTS.filter((p) => p.status === "published")
      .filter((p) => !filter.category || p.categories.includes(filter.category))
      .map(toPublicBlogPost);
  }
}

export async function getPublicBlogPostAction(slug: string): Promise<PublicBlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .or("scheduled_for.is.null,scheduled_for.lte.now")
      .maybeSingle();
    if (error || !data) {
      const mock = MOCK_BLOG_POSTS.find((p) => p.slug === slug && p.status === "published");
      return mock ? toPublicBlogPost(mock) : null;
    }
    const post = publicFromDb(rowToDbBlogPost(data));
    return {
      ...post,
      coverImage: post.coverImage ? await resolveMediaValue(post.coverImage) : null,
      ogImage: post.ogImage ? await resolveMediaValue(post.ogImage) : null,
    };
  } catch {
    const mock = MOCK_BLOG_POSTS.find((p) => p.slug === slug && p.status === "published");
    return mock ? toPublicBlogPost(mock) : null;
  }
}
