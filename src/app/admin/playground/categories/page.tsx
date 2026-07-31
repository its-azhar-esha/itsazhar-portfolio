import { getWorkflowCategories } from "@/lib/hub";
import { WorkflowCategoryManager } from "@/components/admin/playground/workflow-category-manager";

export const dynamic = "force-dynamic";

export default async function AdminWorkflowCategoriesPage() {
  const result = await getWorkflowCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Workflow Categories</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Organize templates in the public library. Published categories appear as filter chips.
        </p>
      </div>
      <WorkflowCategoryManager categories={categories} />
      {!result.success && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {result.error}
        </p>
      )}
    </div>
  );
}
