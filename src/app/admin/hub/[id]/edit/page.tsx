import { notFound } from "next/navigation";
import { getResourceById, getResourceFiles, getResourceCategories } from "@/lib/hub";
import { ResourceForm } from "@/components/admin/hub/resource-form";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resourceResult, filesResult, categoriesResult] = await Promise.all([
    getResourceById(id),
    getResourceFiles(id),
    getResourceCategories(),
  ]);
  if (!resourceResult.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Resource</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update resource details and files.</p>
      </div>
      <ResourceForm
        resource={resourceResult.data}
        files={filesResult.success ? filesResult.data : []}
        categories={categoriesResult.success ? categoriesResult.data : []}
      />
    </div>
  );
}
