import { getAllSeo } from "@/lib/seo";
import { SeoList } from "@/components/admin/seo/seo-list";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const result = await getAllSeo();
  const entries = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">SEO</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage page metadata and search engine settings.
        </p>
      </div>
      <SeoList entries={entries} error={error} />
    </div>
  );
}
