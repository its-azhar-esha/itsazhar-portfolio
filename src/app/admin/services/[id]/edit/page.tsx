import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/services";
import { ServiceForm } from "@/components/admin/services/service-form";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getServiceById(id);
  if (!result.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Service</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update service details.</p>
      </div>
      <ServiceForm service={result.data} />
    </div>
  );
}
