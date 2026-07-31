import { notFound } from "next/navigation";
import { getWorkflowTemplateById, getWorkflowCategories, getWorkflowNodeTypes } from "@/lib/hub";
import { TemplateForm } from "@/components/admin/playground/template-form";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [templateResult, categoriesResult, nodeTypesResult] = await Promise.all([
    getWorkflowTemplateById(id),
    getWorkflowCategories(),
    getWorkflowNodeTypes(),
  ]);
  if (!templateResult.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Template</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Update the workflow canvas, walkthrough and metadata.
        </p>
      </div>
      <TemplateForm
        template={templateResult.data}
        categories={categoriesResult.success ? categoriesResult.data : []}
        nodeTypes={nodeTypesResult.success ? nodeTypesResult.data : []}
      />
    </div>
  );
}
