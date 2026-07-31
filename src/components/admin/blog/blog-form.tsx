"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DbBlogPost } from "@/types/blog";
import {
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
} from "@/lib/blog/actions";
import { createBlogPostSchema } from "@/lib/validation";
import { BLOG_POST_STATUSES } from "@/constants/blog";
import { generateSlug } from "@/lib/slug";
import { renderMarkdown } from "@/lib/blog/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import { MediaField } from "@/components/media/media-field";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { Eye, FileText } from "lucide-react";

interface FormFields {
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  content: string;
  cover_image: string;
  categories: string[];
  tags: string[];
  featured: boolean;
  status: string;
  publishedAt: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  canonical_url: string;
  keywords: string[];
}

function defaultFields(post?: DbBlogPost): FormFields {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    author: post?.author ?? "Azhar",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    cover_image: post?.cover_image ?? "",
    categories: post?.categories ?? [],
    tags: post?.tags ?? [],
    featured: post?.featured ?? false,
    status: post?.status ?? "draft",
    publishedAt: post?.published_at ?? "",
    seo_title: post?.seo_title ?? "",
    seo_description: post?.seo_description ?? "",
    og_image: post?.og_image ?? "",
    canonical_url: post?.canonical_url ?? "",
    keywords: post?.keywords ?? [],
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: fields.title,
    slug: fields.slug,
    author: fields.author,
    excerpt: fields.excerpt,
    content: fields.content,
    cover_image: fields.cover_image || null,
    categories: fields.categories,
    tags: fields.tags,
    featured: fields.featured,
    status: fields.status,
    seo_title: fields.seo_title || null,
    seo_description: fields.seo_description || null,
    og_image: fields.og_image || null,
    canonical_url: fields.canonical_url || null,
    keywords: fields.keywords,
  };
  if (fields.status === "published") {
    data.published_at = fields.publishedAt || new Date().toISOString();
  }
  return data;
}

interface BlogFormProps {
  post?: DbBlogPost;
}

export function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const mode = post ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(post), [post]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [showPreview, setShowPreview] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const slugManuallyEdited = React.useRef(false);
  const toast = useToast();

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
  );

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => {
      const next = { ...prev, ...partial };
      if ("title" in partial && !slugManuallyEdited.current && partial.title) {
        const generated = generateSlug(partial.title);
        if (generated !== next.slug) {
          next.slug = generated;
        }
      }
      return next;
    });
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    handleChange({ slug: value });
  }

  function validate(): boolean {
    const result = createBlogPostSchema.safeParse(fieldsToJson(fields));
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormFields | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors before saving.");
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (mode === "create") {
        const result = await createBlogPostAction(fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Blog post created successfully.");
        router.push("/admin/blog");
      } else {
        const result = await updateBlogPostAction(post!.id, fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Blog post saved.");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      const result = await deleteBlogPostAction(post.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Blog post deleted.");
      router.push("/admin/blog");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/blog");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="border-border/40 flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {mode === "create" ? "New Blog Post" : "Edit Blog Post"}
            </CardTitle>
            {post && (
              <Badge
                variant="outline"
                className={
                  post.status === "published"
                    ? "border-emerald-500/30 text-emerald-500"
                    : "border-amber-500/30 text-amber-500"
                }
              >
                {post.status}
              </Badge>
            )}
          </div>
          {mode === "edit" && post?.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push(`/blog/${post.slug}`)}
            >
              <Eye className="h-3.5 w-3.5" />
              View Post
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="How I automated document processing with AI"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={fields.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="how-i-automated-document-processing"
              />
              <p className="text-muted-foreground text-xs">
                Lowercase letters, numbers, and hyphens. Auto-generated from the title.
              </p>
              {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={fields.author}
                onChange={(e) => handleChange({ author: e.target.value })}
                placeholder="Azhar"
              />
              {errors.author && <p className="text-destructive text-xs">{errors.author}</p>}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={fields.status}
                onChange={(e) => handleChange({ status: e.target.value })}
                className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
              >
                {BLOG_POST_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              value={fields.excerpt}
              onChange={(e) => handleChange({ excerpt: e.target.value })}
              placeholder="Short summary shown on the blog list and in search results."
              rows={2}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            <p className="text-muted-foreground text-xs">
              {fields.excerpt.length} / 500 characters
            </p>
            {errors.excerpt && <p className="text-destructive text-xs">{errors.excerpt}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((prev) => !prev)}
                className="gap-1.5"
              >
                {showPreview ? (
                  <FileText className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            {showPreview ? (
              <div className="border-border bg-muted/20 rounded-lg border px-5 py-4">
                {fields.content.trim() ? (
                  renderMarkdown(fields.content)
                ) : (
                  <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
                )}
              </div>
            ) : (
              <textarea
                id="content"
                value={fields.content}
                onChange={(e) => handleChange({ content: e.target.value })}
                placeholder={
                  "Write your post in Markdown.\n\n## Heading\n\nParagraph with **bold** and [links](https://example.com)."
                }
                rows={16}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-y rounded-lg border px-3 py-2 font-mono text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
              />
            )}
            {errors.content && <p className="text-destructive text-xs">{errors.content}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categories</Label>
              <TagInput
                id="categories"
                value={fields.categories}
                onChange={(categories) => handleChange({ categories })}
                placeholder="Type a category and press Enter"
                hint="Lowercase slugs — e.g. ai-agents, automation, n8n, workflow-design"
              />
              {errors.categories && <p className="text-destructive text-xs">{errors.categories}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                id="tags"
                value={fields.tags}
                onChange={(tags) => handleChange({ tags })}
                placeholder="Type a tag and press Enter"
              />
              {errors.tags && <p className="text-destructive text-xs">{errors.tags}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <MediaField
              value={fields.cover_image}
              onChange={(value) => handleChange({ cover_image: value ?? "" })}
              previewClassName="aspect-video w-full max-w-sm"
            />
            {errors.cover_image && <p className="text-destructive text-xs">{errors.cover_image}</p>}
          </div>

          <div className="border-border/50 flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Featured Post</p>
              <p className="text-muted-foreground text-xs">
                Featured posts are highlighted on the blog listing.
              </p>
            </div>
            <Switch
              checked={fields.featured}
              onCheckedChange={(v) => handleChange({ featured: v })}
            />
          </div>

          <div className="border-border/40 bg-muted/20 space-y-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">SEO</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={fields.seo_title}
                  onChange={(e) => handleChange({ seo_title: e.target.value })}
                  placeholder="Title shown in search results (max 70)"
                />
                <p className="text-muted-foreground text-xs">
                  {fields.seo_title.length} / 70 characters
                </p>
                {errors.seo_title && <p className="text-destructive text-xs">{errors.seo_title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input
                  id="canonical_url"
                  value={fields.canonical_url}
                  onChange={(e) => handleChange({ canonical_url: e.target.value })}
                  placeholder="https://itsazhar-portfolio.vercel.app/blog/..."
                />
                {errors.canonical_url && (
                  <p className="text-destructive text-xs">{errors.canonical_url}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <textarea
                id="seo_description"
                value={fields.seo_description}
                onChange={(e) => handleChange({ seo_description: e.target.value })}
                placeholder="Meta description shown in search results (max 160)"
                rows={2}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
              />
              <p className="text-muted-foreground text-xs">
                {fields.seo_description.length} / 160 characters
              </p>
              {errors.seo_description && (
                <p className="text-destructive text-xs">{errors.seo_description}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>OG Image</Label>
                <MediaField
                  value={fields.og_image}
                  onChange={(value) => handleChange({ og_image: value ?? "" })}
                  previewClassName="aspect-video w-full max-w-xs"
                />
                {errors.og_image && <p className="text-destructive text-xs">{errors.og_image}</p>}
              </div>
              <div className="space-y-2">
                <Label>SEO Keywords</Label>
                <TagInput
                  id="keywords"
                  value={fields.keywords}
                  onChange={(keywords) => handleChange({ keywords })}
                  placeholder="Type a keyword and press Enter"
                />
                {errors.keywords && <p className="text-destructive text-xs">{errors.keywords}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={mode !== "edit" || saving}
        >
          Delete
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || (mode === "edit" && !hasChanges)}>
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create Post"
                : fields.status === "published"
                  ? "Save Changes"
                  : "Save Draft"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete blog post"
        description={`Are you sure you want to delete "${post?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
