import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { HelpButton } from "@/components/ui/help-dialog";
import { IntegrationManager } from "@/components/admin/integrations/integration-manager";
import { getIntegrationsAction } from "@/lib/integrations/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Integrations | Admin" };

export default async function IntegrationsPage() {
  const result = await getIntegrationsAction();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            API keys for external services used by the site. Keys you save here are encrypted
            (AES-256-GCM) before being stored and are only ever shown as a masked preview — the full
            value is never displayed again.
          </p>
        </div>
        <HelpButton
          helpId="integrations-page"
          label="Help about the Integrations page"
          align="left"
        />
      </div>

      {result.success ? (
        <IntegrationManager initial={result.data} />
      ) : (
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Could not load integrations</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
}
