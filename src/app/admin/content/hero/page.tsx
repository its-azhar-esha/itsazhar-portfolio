import { getAdminHeroContent } from "@/lib/hero";
import { HeroEditor } from "@/components/admin/content/hero-form";

export default async function AdminContentHeroPage() {
  const hero = await getAdminHeroContent();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Hero Section</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit the homepage hero — headline, actions, badges, and background.
        </p>
      </div>
      <HeroEditor initial={hero} />
    </div>
  );
}
