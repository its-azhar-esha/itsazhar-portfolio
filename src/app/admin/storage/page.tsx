import type { Metadata } from "next";
import { StorageManager } from "@/components/admin/storage/storage-manager";
import { HelpButton } from "@/components/ui/help-dialog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Storage & Cleanup | Admin" };

export default function StoragePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage &amp; Cleanup</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Identify and safely remove unused media, orphaned storage objects, broken references and
            old records. Cleanup only touches items verified unused at execution time — anything in
            use by the site or CMS is never deleted.
          </p>
        </div>
        <HelpButton helpId="storage-cleanup" label="Help about Storage & Cleanup" align="left" />
      </div>
      <StorageManager />
    </div>
  );
}
