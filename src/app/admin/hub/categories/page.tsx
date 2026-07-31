import Link from "next/link";
import { getResourceCategories } from "@/lib/hub";
import { CategoryManager } from "@/components/admin/hub/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminHubCategoriesPage() {
  const result = await getResourceCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin/hub"
          className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          ← Back to Hub
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Hub Categories</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Group resources into browseable categories shown as filter chips on /hub.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
