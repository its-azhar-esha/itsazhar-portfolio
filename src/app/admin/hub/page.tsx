import Link from "next/link";
import { getResources, getResourceCategories } from "@/lib/hub";
import { ResourceList } from "@/components/admin/hub/resource-list";

export const dynamic = "force-dynamic";

export default async function AdminHubPage() {
  const [resourcesResult, categoriesResult] = await Promise.all([
    getResources(),
    getResourceCategories(),
  ]);
  const resources = resourcesResult.success ? resourcesResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const error = resourcesResult.success ? null : resourcesResult.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Automation Hub</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Templates, agents, prompts and tools — every downloadable resource on your site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/hub/categories"
            className="border-border hover:border-primary/40 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/admin/hub/collections"
            className="border-border hover:border-primary/40 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Collections
          </Link>
        </div>
      </div>
      <ResourceList resources={resources} categories={categories} error={error} />
    </div>
  );
}
