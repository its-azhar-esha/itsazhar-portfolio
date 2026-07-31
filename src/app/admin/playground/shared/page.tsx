import { getUserWorkflows } from "@/lib/hub";
import { SharedWorkflowsList } from "@/components/admin/playground/shared-workflows-list";

export const dynamic = "force-dynamic";

export default async function AdminSharedWorkflowsPage() {
  const result = await getUserWorkflows();
  const workflows = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Shared Workflows</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Workflows visitors saved with the Save &amp; Share button in the builder.
        </p>
      </div>
      <SharedWorkflowsList workflows={workflows} error={error} />
    </div>
  );
}
