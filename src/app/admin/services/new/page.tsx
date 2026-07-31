import { ServiceForm } from "@/components/admin/services/service-form";

export const dynamic = "force-dynamic";

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Service</h2>
        <p className="text-muted-foreground mt-1 text-sm">Create a new service.</p>
      </div>
      <ServiceForm />
    </div>
  );
}
