import { getResourceCategories } from "@/lib/hub";
import { ResourceForm } from "@/components/admin/hub/resource-form";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const result = await getResourceCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Resource</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a template, agent, prompt or tool to the automation hub.
        </p>
      </div>
      <ResourceForm categories={categories} />
    </div>
  );
}
