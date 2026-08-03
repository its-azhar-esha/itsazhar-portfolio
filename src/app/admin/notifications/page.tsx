import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import { HelpButton } from "@/components/ui/help-dialog";
import { NotificationManager } from "@/components/admin/notifications/notification-manager";
import { getNotificationOverviewAction } from "@/lib/notifications/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notifications | Admin" };

export default async function NotificationsPage() {
  const result = await getNotificationOverviewAction();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Receive real-time Telegram alerts for leads, content changes, backups, health checks,
            scheduled jobs and security events. Turn categories or individual events on and off, set
            per-event priorities, and manage who receives them. Every message includes a timestamp,
            event type and description.
          </p>
        </div>
        <HelpButton
          helpId="notifications-page"
          label="Help about the Notifications page"
          align="left"
        />
      </div>

      {result.success ? (
        <NotificationManager initial={result.data} />
      ) : (
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
            <BellRing className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Could not load notification settings</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
}
