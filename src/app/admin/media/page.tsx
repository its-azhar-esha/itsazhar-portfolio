import { MediaManager } from "@/components/admin/media/media-manager";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Media</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload and manage reusable images for every CMS module.
        </p>
      </div>
      <MediaManager />
    </div>
  );
}
