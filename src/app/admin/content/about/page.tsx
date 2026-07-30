import { getAdminAboutContent } from "@/lib/about";
import { AboutEditor } from "@/components/admin/content/about-form";

export default async function AdminContentAboutPage() {
  const about = await getAdminAboutContent();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">About Page</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your biography, tools, timeline, social links, and more.
        </p>
      </div>
      <AboutEditor initial={about} />
    </div>
  );
}
