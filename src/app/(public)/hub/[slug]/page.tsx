import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, Download, FileText, History, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPublicResourceAction } from "@/lib/hub/actions";
import { getPublicPageContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site/urls";
import { DEFAULT_HUB_CONTENT, type HubPageContent } from "@/lib/content/defaults/hub";
import { getPublicSiteSettings } from "@/lib/settings";
import { renderMarkdown } from "@/lib/markdown";
import { DownloadButton } from "@/components/hub/download-button";
import { RESOURCE_TYPE_LABELS } from "@/constants/hub";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublicResourceAction(slug);
  if (!resource) return { title: "Resource not found" };
  const baseUrl = await getSiteUrl();

  const title = resource.seo_title || `${resource.title} | ${RESOURCE_TYPE_LABELS[resource.type]}`;
  const description = resource.seo_description || resource.summary;
  const canonical = resource.canonical_url || `${baseUrl}/hub/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      ...(resource.ogUrl ? { images: [{ url: resource.ogUrl }] } : {}),
    },
    twitter: {
      card: resource.ogUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(resource.ogUrl ? { images: [resource.ogUrl] } : {}),
    },
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [resource, settings, content] = await Promise.all([
    getPublicResourceAction(slug),
    getPublicSiteSettings(),
    getPublicPageContent<HubPageContent>("hub", DEFAULT_HUB_CONTENT),
  ]);
  if (!resource) notFound();

  const premium = resource.access_level === "premium";

  return (
    <div className="pt-24 md:pt-32">
      <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/hub"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {content.detail.back}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-primary bg-primary/10 border-primary/30 border">
                {RESOURCE_TYPE_LABELS[resource.type]}
              </Badge>
              {resource.category && <Badge variant="outline">{resource.category.name}</Badge>}
              {resource.featured && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  {content.detail.featured}
                </Badge>
              )}
              {premium && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  <Lock className="h-3 w-3" />
                  {content.detail.premium}
                </Badge>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{resource.title}</h1>
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{resource.summary}</p>

            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {resource.version && <span>Version {resource.version}</span>}
              <span>
                {resource.downloads_count} download{resource.downloads_count === 1 ? "" : "s"}
              </span>
              <span>
                Updated{" "}
                {new Date(resource.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {resource.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-muted-foreground border-border/60 rounded-full border px-2.5 py-0.5 text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {resource.coverUrl && (
              <div className="bg-muted relative mt-8 aspect-video overflow-hidden rounded-xl">
                <Image
                  src={resource.coverUrl}
                  alt={resource.title}
                  fill
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="mt-8 max-w-3xl">{renderMarkdown(resource.content)}</div>

            {resource.changelog.length > 0 && (
              <section className="mt-12">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <History className="h-4 w-4" />
                  {content.detail.versionHistory}
                </h2>
                <div className="border-border/60 mt-4 divide-y rounded-lg border">
                  {resource.changelog.map((entry) => (
                    <details key={`${entry.version}-${entry.date}`} className="group px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between">
                        <span className="text-sm font-semibold">
                          v{entry.version}
                          <span className="text-muted-foreground ml-2 text-xs font-normal">
                            {entry.date}
                          </span>
                        </span>
                        <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                        {entry.notes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-border/50 bg-card space-y-4 rounded-xl border p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                    {content.detail.price}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    {resource.pricing.model === "free" ? (
                      <span className="text-emerald-500">{content.detail.free}</span>
                    ) : (
                      <span className="text-primary">
                        {resource.pricing.price
                          ? `${resource.pricing.currency ?? "$"}${resource.pricing.price}`
                          : content.detail.paid}
                        {resource.pricing.model === "subscription" && (
                          <span className="text-muted-foreground text-sm font-medium">
                            {content.detail.perMonth}
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {resource.pricing.model === "free"
                      ? content.detail.pricingFree
                      : resource.pricing.model === "subscription"
                        ? content.detail.pricingSubscription
                        : content.detail.pricingOneTime}
                  </p>
                </div>
                {resource.access_level === "premium" && (
                  <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black uppercase shadow-md">
                    Premium
                  </span>
                )}
              </div>
              {resource.pricing.model !== "free" && resource.pricing.purchase_url ? (
                <a
                  href={resource.pricing.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="cta_click"
                  data-track-label={`Get access: ${resource.title}`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {content.detail.getAccess}
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-500">
                  <Download className="h-4 w-4" />
                  {content.detail.freeDownload}
                </div>
              )}

              <div className="border-border/50 flex items-center justify-between border-t pt-3">
                <p className="text-sm font-semibold">{content.detail.files}</p>
                <p className="text-muted-foreground text-xs">
                  {resource.files.length} file{resource.files.length === 1 ? "" : "s"}
                </p>
              </div>

              {resource.files.length === 0 ? (
                <p className="text-muted-foreground border-border/50 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                  {content.detail.noFiles}
                </p>
              ) : (
                <div className="space-y-3">
                  {resource.files.map((file) => (
                    <div key={file.id} className="border-border/60 space-y-2 rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{file.label}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {file.file_type} · {formatSize(file.file_size)} · {file.download_count}{" "}
                            downloads
                          </p>
                        </div>
                      </div>
                      {file.description && (
                        <p className="text-muted-foreground text-xs">{file.description}</p>
                      )}
                      {premium && !resource.pricing.purchase_url ? (
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Lock className="h-3 w-3" />
                          {content.detail.unlock}
                        </p>
                      ) : (
                        <DownloadButton file={file} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {resource.metadata && Object.keys(resource.metadata).length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
                    {content.detail.details}
                  </p>
                  <dl className="text-muted-foreground space-y-1 text-xs">
                    {Object.entries(resource.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3">
                        <dt className="capitalize">{key.replace(/_/g, " ")}</dt>
                        <dd className="truncate">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            <div className="border-border/50 bg-card mt-4 rounded-xl border p-5 text-center">
              <p className="text-muted-foreground text-xs">{content.detail.ctaTitle}</p>
              <Link href={settings.booking_url || "/contact"}>
                <p className="text-primary mt-1 text-sm font-semibold">
                  {content.detail.ctaButton}
                </p>
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
