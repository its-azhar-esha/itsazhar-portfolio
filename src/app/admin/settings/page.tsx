import { AlertCircle } from "lucide-react";
import { getSettings, settingsWithDefaults } from "@/lib/settings/repository";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const result = await getSettings();
  const settings = settingsWithDefaults(result.success ? result.data : null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Site configuration and preferences.</p>
      </div>

      {!result.success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Could not load settings from the database: {result.error}</span>
        </div>
      )}

      <SettingsForm initial={settings} />
    </div>
  );
}
