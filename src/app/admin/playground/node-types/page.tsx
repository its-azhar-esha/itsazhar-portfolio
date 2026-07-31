import { getWorkflowNodeTypes } from "@/lib/hub";
import { NodeTypeManager } from "@/components/admin/playground/node-type-manager";

export const dynamic = "force-dynamic";

export default async function AdminNodeTypesPage() {
  const result = await getWorkflowNodeTypes();
  const nodeTypes = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Node Types</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Every node available in the workflow builder. The key is stored inside workflow files, so
          keep keys stable once workflows exist.
        </p>
      </div>
      <NodeTypeManager nodeTypes={nodeTypes} error={result.success ? null : result.error} />
    </div>
  );
}
