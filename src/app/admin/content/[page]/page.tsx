import { notFound } from "next/navigation";
import { getPageContentDefinition } from "@/lib/content/schemas";
import { getAdminPageContent, deepMerge } from "@/lib/content";
import { PAGE_DEFAULTS } from "@/lib/content/page-defaults";
import { PageContentEditor } from "@/components/admin/content/page-content-editor";

export default async function AdminPageContentPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const definition = getPageContentDefinition(page);
  if (!definition) notFound();

  const defaults = PAGE_DEFAULTS[page] ?? {};
  const stored = await getAdminPageContent(page);
  const initial = deepMerge(defaults, stored?.content ?? {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">{definition.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
      </div>
      <PageContentEditor
        pageKey={page}
        pageTitle={definition.title}
        description={definition.description}
        initial={initial}
        groups={definition.groups}
      />
    </div>
  );
}
