import type { BlogPostStatus } from "@/constants/blog";
import type { PublicBlogPost } from "@/types/blog";

export interface MockBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  categories: string[];
  tags: string[];
  author: string;
  status: BlogPostStatus;
  featured: boolean;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  keywords: string[];
}

export const MOCK_BLOG_POSTS: MockBlogPost[] = [
  {
    slug: "ai-agents-vs-workflows-what-your-business-actually-needs",
    title: "AI Agents vs. Workflows: What Your Business Actually Needs",
    excerpt:
      "Not every automation problem needs an AI agent. Here's how to choose between deterministic workflows and agentic systems — and when to combine both.",
    content: [
      "# AI Agents vs. Workflows",
      "",
      "Two words dominate automation conversations: **workflows** and **agents**. Both eliminate manual work, but they solve different problems.",
      "",
      "## What a workflow is",
      "",
      "A workflow is a *deterministic* chain of steps: trigger → process → output. n8n, Zapier and Make excel here. If your process never changes shape, a workflow is the right answer.",
      "",
      "## What an AI agent is",
      "",
      "An agent makes *decisions* mid-task. It can plan, use tools, and recover from unexpected input. This matters when the input is unpredictable — invoices in 20 formats, emails with ambiguous requests, documents with missing fields.",
      "",
      "## How to choose",
      "",
      "- **Fixed process, clean data** → workflow",
      "- **Varied input, need for judgment** → agent",
      "- **Everything else** → a hybrid: a workflow that calls an agent at the decision point",
      "",
      "## Bottom line",
      "",
      "Start deterministic, add intelligence only where it pays for itself. Most businesses need 80% workflows and 20% agents.",
      "",
      "> Want to know which parts of your operation are ready for automation? Book a free audit.",
    ].join("\n"),
    cover_image: null,
    categories: ["ai-agents", "workflow-design"],
    tags: ["ai agents", "n8n", "automation strategy"],
    author: "Azhar",
    status: "published",
    featured: true,
    published_at: "2026-07-20T09:00:00.000Z",
    seo_title: "AI Agents vs. Workflows: What Your Business Needs",
    seo_description:
      "Workflows and AI agents solve different problems. Learn how to choose the right automation approach for your business.",
    og_image: null,
    canonical_url: null,
    keywords: ["ai agents", "workflows", "automation"],
  },
  {
    slug: "n8n-workflow-design-principles",
    title: "n8n Workflow Design Principles I Use on Every Client Project",
    excerpt:
      "Reliable automation isn't about fancy nodes — it's about error handling, idempotency, and boring, testable design. Here are the principles I apply.",
    content: [
      "# n8n Workflow Design Principles",
      "",
      "After building dozens of production n8n workflows, I've learned what separates reliable systems from fragile demos.",
      "",
      "## 1. Design for failure first",
      "",
      "Every workflow *will* fail eventually. Add error branches, retry with exponential backoff, and route failures to a dedicated alert channel instead of a silent dead-end.",
      "",
      "## 2. Make every step idempotent",
      "",
      "A retried run must not double-create records. Use unique keys on inserts, and check-before-create on webhook triggers.",
      "",
      "## 3. Log at the edges",
      "",
      "Log the raw webhook payload and the final output. When something breaks at 2am, that's the only debugging surface you'll have.",
      "",
      "## 4. Keep data out of node names",
      "",
      "Node names are for humans. Put dynamic values in variables and item fields, not in the display title.",
      "",
      "## 5. Test with real data",
      "",
      "Mock data hides the exact bugs real data exposes. Build a test suite with anonymized production payloads.",
      "",
      "> These principles are the difference between a demo and a system you can trust for years.",
    ].join("\n"),
    cover_image: null,
    categories: ["n8n", "workflow-design"],
    tags: ["n8n", "workflow", "reliability"],
    author: "Azhar",
    status: "published",
    featured: false,
    published_at: "2026-07-12T09:00:00.000Z",
    seo_title: null,
    seo_description: null,
    og_image: null,
    canonical_url: null,
    keywords: ["n8n", "workflow design"],
  },
];

export function toPublicBlogPost(post: MockBlogPost): PublicBlogPost {
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
    publishedAt: post.published_at,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    ogImage: post.og_image,
    canonicalUrl: post.canonical_url,
    keywords: post.keywords,
  };
}
