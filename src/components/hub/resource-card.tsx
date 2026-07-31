import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download, FileText, Star } from "lucide-react";
import type { PublicResource } from "@/types/hub";
import { RESOURCE_TYPE_LABELS } from "@/constants/hub";

function formatPrice(resource: PublicResource): string {
  const pricing = resource.pricing;
  if (pricing.model === "free") return "Free";
  const price = pricing.price ? `${pricing.currency ?? "$"}${pricing.price}` : "Paid";
  return pricing.model === "subscription" ? `From ${price}/mo` : price;
}

export function ResourceCard({ resource }: { resource: PublicResource }) {
  const isFree = resource.pricing.model === "free";
  const premium = resource.access_level === "premium";

  return (
    <Link
      href={`/hub/${resource.slug}`}
      className="group border-border/50 bg-card hover:border-primary/40 relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="bg-muted relative aspect-[16/10] overflow-hidden">
        {resource.coverUrl ? (
          <Image
            src={resource.coverUrl}
            alt={resource.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="from-primary/15 absolute inset-0 bg-gradient-to-br to-teal-500/10" />
        )}
        <span className="bg-background/80 text-foreground absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase backdrop-blur-sm">
          {RESOURCE_TYPE_LABELS[resource.type]}
        </span>
        {premium && (
          <span className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black uppercase shadow-md">
            Premium
          </span>
        )}
        {resource.featured && (
          <span className="bg-primary text-primary-foreground absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="group-hover:text-primary line-clamp-1 text-sm font-semibold tracking-tight transition-colors">
          {resource.title}
        </h2>
        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed">
          {resource.summary}
        </p>

        <div className="text-muted-foreground mt-3 flex items-center gap-3 text-[11px]">
          {resource.category && <span className="truncate">{resource.category.name}</span>}
          <span className="flex shrink-0 items-center gap-1">
            <FileText className="h-3 w-3" />
            {resource.files.length}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Download className="h-3 w-3" />
            {resource.downloads_count.toLocaleString()}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span
            className={
              isFree
                ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500"
                : "text-primary bg-primary/10 rounded-full px-2.5 py-1 text-xs font-bold"
            }
          >
            {formatPrice(resource)}
          </span>
          <span className="text-muted-foreground group-hover:text-primary flex items-center gap-0.5 text-xs font-semibold transition-colors">
            View
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
