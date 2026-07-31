import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { DbBlogPost, CreateBlogPostInput, UpdateBlogPostInput } from "@/types/blog";
import type { BlogPostStatus } from "@/constants/blog";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "blog_posts" as const;

export function rowToDbBlogPost(
  row: Database["public"]["Tables"]["blog_posts"]["Row"],
): DbBlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover_image: row.cover_image,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    author: row.author,
    status: row.status as BlogPostStatus,
    featured: row.featured,
    published_at: row.published_at,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    og_image: row.og_image,
    canonical_url: row.canonical_url,
    keywords: row.keywords ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface BlogPostFilter {
  status?: BlogPostStatus;
  search?: string;
  category?: string;
  tag?: string;
}

export async function getBlogPosts(filter: BlogPostFilter = {}): Promise<Result<DbBlogPost[]>> {
  try {
    const supabase = await createClient();
    let query = supabase.from(TABLE).select("*");

    if (filter.status) query = query.eq("status", filter.status);
    if (filter.category) query = query.contains("categories", [filter.category]);
    if (filter.tag) query = query.contains("tags", [filter.tag]);
    if (filter.search) {
      const q = filter.search.trim();
      if (q) query = query.ilike("title", `%${q}%`);
    }

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);
    return ok((data ?? []).map(rowToDbBlogPost));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list blog posts");
  }
}

export async function getBlogPostById(id: string): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Blog post with id "${id}" not found`);
    return ok(rowToDbBlogPost(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch blog post");
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail(`Blog post with slug "${slug}" not found`);
    return ok(rowToDbBlogPost(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to fetch blog post");
  }
}

export async function createBlogPost(input: CreateBlogPostInput): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) return fail(`A blog post with slug "${input.slug}" already exists.`);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(input as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to create blog post — no data returned.");
    return ok(rowToDbBlogPost(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create blog post");
  }
}

export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput,
): Promise<Result<DbBlogPost>> {
  try {
    const supabase = await createClient();

    if (input.slug) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) return fail(`Another blog post already uses slug "${input.slug}".`);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(input as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Blog post with id "${id}" not found.`);
    return ok(rowToDbBlogPost(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update blog post");
  }
}

export async function deleteBlogPost(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete blog post");
  }
}
