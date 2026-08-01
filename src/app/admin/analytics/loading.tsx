import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function AnalyticsLoading() {
  return (
    <AdminPageSkeleton
      title="Analytics"
      description="Loading visitor activity from the last 30 days..."
      statTiles={4}
      cards={6}
      wide
    />
  );
}
