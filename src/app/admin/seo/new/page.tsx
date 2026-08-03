import { SeoForm } from "@/components/admin/seo/seo-form";
import { DEFAULT_SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function NewSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ page_key?: string }>;
}) {
  const { page_key } = await searchParams;
  const defaultSeo = page_key ? DEFAULT_SEO[page_key] : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New SEO Entry</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {page_key ? `Create metadata for the "${page_key}" page.` : "Create metadata for a page."}
        </p>
      </div>
      <SeoForm
        prefill={
          page_key
            ? {
                page_key,
                title: defaultSeo?.title ?? "",
                description: defaultSeo?.description ?? "",
                keywords: defaultSeo?.keywords?.join(", ") ?? "",
                og_image: defaultSeo?.og_image ?? "",
                canonical_url: defaultSeo?.canonical_url ?? "",
                robots: defaultSeo?.robots ?? "index,follow",
              }
            : undefined
        }
      />
    </div>
  );
}
