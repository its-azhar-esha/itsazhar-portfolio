import { getWorkflowCategories, getWorkflowNodeTypes } from "@/lib/hub";
import { TemplateForm } from "@/components/admin/playground/template-form";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const [categoriesResult, nodeTypesResult] = await Promise.all([
    getWorkflowCategories(),
    getWorkflowNodeTypes(),
  ]);
  const categoriesError = categoriesResult.success ? null : categoriesResult.error;
  const nodeTypesError = nodeTypesResult.success ? null : nodeTypesResult.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Template</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Build a workflow on the canvas and publish it to the library.
        </p>
      </div>
      <TemplateForm
        categories={categoriesResult.success ? categoriesResult.data : []}
        nodeTypes={nodeTypesResult.success ? nodeTypesResult.data : []}
      />
      {(categoriesError || nodeTypesError) && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {categoriesError || nodeTypesError}
        </p>
      )}
    </div>
  );
}
