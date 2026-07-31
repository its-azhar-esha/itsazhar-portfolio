import { LeadsManager } from "@/components/admin/leads/leads-manager";

export const dynamic = "force-dynamic";

export default function AdminLeadsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Captured from the &quot;Book a Free Audit&quot; form on the public site.
        </p>
      </div>
      <LeadsManager />
    </div>
  );
}
