import { AdminShell } from "@/components/admin/shell";
import { getSettings } from "@/lib/settings";
import { SETTINGS_ROW_ID, DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/types/settings";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let settings: SiteSettings = {
    id: SETTINGS_ROW_ID,
    created_at: "",
    updated_at: "",
    ...DEFAULT_SITE_SETTINGS,
  };
  const result = await getSettings();
  if (result.success && result.data) {
    settings = result.data;
  }

  return <AdminShell settings={settings}>{children}</AdminShell>;
}
