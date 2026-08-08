import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPageMetadata } from "@/lib/seo";
import { getPublicPageContent } from "@/lib/content";
import { DEFAULT_PRIVACY_CONTENT, type PrivacyPageContent } from "@/lib/content/defaults/privacy";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("privacy");
}

export default async function PrivacyPage() {
  const content = await getPublicPageContent<PrivacyPageContent>(
    "privacy",
    DEFAULT_PRIVACY_CONTENT,
  );

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
            <Shield className="h-3.5 w-3.5" />
            Legal
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-sm">Last updated: {content.lastUpdated}</p>
          <p className="text-muted-foreground mt-6 text-base leading-relaxed md:text-lg">
            {content.intro}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {content.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border/60 bg-card/60 mt-14 rounded-xl border p-6 backdrop-blur-sm md:p-8">
            <h2 className="text-lg font-semibold tracking-tight">{content.contactTitle}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
              {content.contactBody}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
