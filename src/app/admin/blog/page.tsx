import { getBlogPosts } from "@/lib/blog";
import { BlogList } from "@/components/admin/blog/blog-list";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const result = await getBlogPosts();
  const posts = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Blog Posts</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Write and publish posts to build authority. Drafts stay private until published.
        </p>
      </div>
      <BlogList posts={posts} error={error} />
    </div>
  );
}
