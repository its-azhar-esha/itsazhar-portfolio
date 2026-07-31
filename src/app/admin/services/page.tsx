import { getServices } from "@/lib/services";
import { ServiceList } from "@/components/admin/services/service-list";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const result = await getServices();
  const services = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Services</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your services and offerings.</p>
      </div>
      <ServiceList services={services} error={error} />
    </div>
  );
}
