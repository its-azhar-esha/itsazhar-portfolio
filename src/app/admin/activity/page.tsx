import type { Metadata } from "next";
import { Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/ui/help-dialog";
import { getAuditLogAction } from "@/lib/security/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Activity | Admin" };

interface ActivityPageProps {
  searchParams: Promise<{ entity?: string }>;
}

function formatAction(action: string): string {
  return action.replace(/\./g, " · ");
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const { entity } = await searchParams;
  const result = await getAuditLogAction(100, entity);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <p className="text-lg font-semibold">Could not load activity log</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const entries = result.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Every important change made in the admin panel, recorded automatically. Entries are
            kept in chronological order with the person who made them.
          </p>
        </div>
        <HelpButton helpId="activity-page" label="Help about the Activity page" align="left" />
      </div>

      <form method="get" className="flex items-center gap-2">
        <label
          htmlFor="entity-filter"
          className="text-muted-foreground text-sm font-medium"
        >
          Filter by section
        </label>
        <select
          id="entity-filter"
          name="entity"
          defaultValue={entity ?? ""}
          className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-56 rounded-lg border px-3 py-1 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
        >
          <option value="">All sections</option>
          <option value="media">Media</option>
          <option value="blog_posts">Blog posts</option>
          <option value="projects">Projects</option>
          <option value="services">Services</option>
          <option value="content_entries">Content entries</option>
          <option value="seo">SEO</option>
          <option value="settings">Settings</option>
          <option value="integration">Integrations</option>
        </select>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-lg px-4 text-sm font-medium transition-colors"
        >
          Apply
        </button>
      </form>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <ActivityIcon className="h-3.5 w-3.5" />
            </span>
            {entity ? `Activity · ${entity}` : "Activity"} · latest 100
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3 pb-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No activity recorded yet{entity ? ` for "${entity}"` : ""}. Admin actions appear here
              automatically.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="border-border/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs"
                >
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                    {formatAction(e.action)}
                  </span>
                  {e.entity && (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                      {e.entity}
                    </span>
                  )}
                  {e.entityId && (
                    <span className="text-muted-foreground truncate font-mono">
                      {e.entityId.slice(0, 8)}…
                    </span>
                  )}
                  {Object.keys(e.detail).length > 0 && (
                    <span
                      className="text-muted-foreground truncate"
                      title={JSON.stringify(e.detail)}
                    >
                      {JSON.stringify(e.detail).slice(0, 80)}
                    </span>
                  )}
                  <span className="text-muted-foreground ml-auto shrink-0">
                    {new Date(e.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {e.createdBy ? ` · ${e.createdBy}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
