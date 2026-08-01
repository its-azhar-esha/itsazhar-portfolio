import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function DxLoading() {
  return (
    <AdminPageSkeleton
      title="Developer Tools"
      description="Running health checks, backups, references and SEO validation..."
      statTiles={4}
      cards={10}
      wide
    />
  );
}
