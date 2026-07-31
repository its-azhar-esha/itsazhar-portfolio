import { notFound } from "next/navigation";
import { getBlogPostById } from "@/lib/blog";
import { BlogForm } from "@/components/admin/blog/blog-form";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getBlogPostById(id);
  if (!result.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Blog Post</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update post details and content.</p>
      </div>
      <BlogForm post={result.data} />
    </div>
  );
}
