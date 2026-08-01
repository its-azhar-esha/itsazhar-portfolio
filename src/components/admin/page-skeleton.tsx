import { cn } from "@/lib/utils";

/**
 * Streaming skeleton for admin pages that load data on the server. Renders
 * instantly while the page's real queries run, so the interface is never blank.
 */
export function AdminPageSkeleton({
  title,
  description,
  statTiles = 4,
  cards = 6,
  wide = false,
}: {
  title: string;
  description: string;
  statTiles?: number;
  cards?: number;
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto space-y-6 px-4 py-8 sm:px-6", wide ? "max-w-6xl" : "max-w-5xl")}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="bg-muted/50 h-3 w-3 animate-pulse rounded-full" />
          <span className="bg-muted/50 h-3 w-40 animate-pulse rounded" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: statTiles }).map((_, i) => (
          <div key={i} className="border-border/50 bg-card rounded-xl border p-4">
            <div className="bg-muted/70 h-7 w-16 animate-pulse rounded-lg" />
            <div className="bg-muted/50 mt-2 h-3 w-24 animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className={cn("grid gap-6", wide ? "lg:grid-cols-2" : "grid-cols-1")}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "border-border/50 bg-card rounded-xl border p-4",
              wide && i === 0 && "lg:col-span-2",
              wide && i === 1 && "lg:col-span-2",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="bg-muted/70 h-7 w-7 animate-pulse rounded-md" />
              <div className="bg-muted/50 h-3.5 w-40 animate-pulse rounded" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="bg-muted/40 h-4 w-full animate-pulse rounded" />
              <div className="bg-muted/40 h-4 w-5/6 animate-pulse rounded" />
              <div className="bg-muted/40 h-4 w-2/3 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
