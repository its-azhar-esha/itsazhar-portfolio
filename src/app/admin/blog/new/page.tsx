import { BlogForm } from "@/components/admin/blog/blog-form";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Blog Post</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Write in Markdown. Publish when you are ready.
        </p>
      </div>
      <BlogForm />
    </div>
  );
}
