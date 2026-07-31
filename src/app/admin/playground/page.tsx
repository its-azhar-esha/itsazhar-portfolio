import Link from "next/link";
import { getWorkflowTemplates, getWorkflowCategories } from "@/lib/hub";
import { TemplateList } from "@/components/admin/playground/template-list";

export const dynamic = "force-dynamic";

export default async function AdminPlaygroundPage() {
  const [templatesResult, categoriesResult] = await Promise.all([
    getWorkflowTemplates(),
    getWorkflowCategories(),
  ]);
  const templates = templatesResult.success ? templatesResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const error = templatesResult.success ? null : templatesResult.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Workflow Playground</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visual workflow templates, the node library and visitor-shared workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/playground/node-types"
            className="border-border hover:border-primary/40 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Node Types
          </Link>
          <Link
            href="/admin/playground/categories"
            className="border-border hover:border-primary/40 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/admin/playground/shared"
            className="border-border hover:border-primary/40 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Shared Workflows
          </Link>
        </div>
      </div>
      <TemplateList templates={templates} categories={categories} error={error} />
    </div>
  );
}
