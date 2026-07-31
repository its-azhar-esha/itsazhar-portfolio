import { notFound } from "next/navigation";
import { getSeoById } from "@/lib/seo";
import { SeoForm } from "@/components/admin/seo/seo-form";

export const dynamic = "force-dynamic";

export default async function EditSeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSeoById(id);
  if (!result.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit SEO Entry</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Update page metadata and search engine settings.
        </p>
      </div>
      <SeoForm entry={result.data} />
    </div>
  );
}
