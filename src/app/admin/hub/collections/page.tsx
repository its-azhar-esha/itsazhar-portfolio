import Link from "next/link";
import { getResourceCollections, getResources, getCollectionItems } from "@/lib/hub";
import { CollectionManager } from "@/components/admin/hub/collection-manager";

export const dynamic = "force-dynamic";

export default async function AdminHubCollectionsPage() {
  const [collectionsResult, resourcesResult] = await Promise.all([
    getResourceCollections(),
    getResources(),
  ]);
  const collections = collectionsResult.success ? collectionsResult.data : [];
  const resources = resourcesResult.success ? resourcesResult.data : [];

  const collectionItems: Record<string, string[]> = {};
  for (const collection of collections) {
    const items = await getCollectionItems(collection.id);
    collectionItems[collection.id] = items.success ? items.data : [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin/hub"
          className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          ← Back to Hub
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Hub Collections</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Curated groups of resources shown as cards on the hub listing.
        </p>
      </div>
      <CollectionManager
        collections={collections}
        resources={resources}
        collectionItems={collectionItems}
      />
    </div>
  );
}
