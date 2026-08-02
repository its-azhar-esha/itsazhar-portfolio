import type { Metadata } from "next";
import { ShieldCheck, LogIn, Ban, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpButton } from "@/components/ui/help-dialog";
import { getLoginHistoryAction } from "@/lib/security/actions";
import { formatDateTimeBD } from "@/lib/format/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Security | Admin" };

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-500"
      : tone === "danger"
        ? "bg-red-500/10 text-red-500"
        : "bg-primary/10 text-primary";
  return (
    <Card className="border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-1 pb-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function SecurityPage() {
  const result = await getLoginHistoryAction(100);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <p className="text-lg font-semibold">Could not load login history</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  const entries = result.data;
  const successful = entries.filter((e) => e.success).length;
  const failed = entries.length - successful;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Sign-in attempts against the admin panel. Every login — successful or not — is recorded
            with the IP address and browser used.
          </p>
        </div>
        <HelpButton helpId="security-page" label="Help about the Security page" align="left" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={LogIn} label="Attempts" value={String(entries.length)} tone="default" />
        <StatCard
          icon={CheckCircle2}
          label="Successful"
          value={String(successful)}
          tone="success"
        />
        <StatCard icon={Ban} label="Failed" value={String(failed)} tone="danger" />
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            Login history · latest 100
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3 pb-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No sign-in attempts recorded yet. They appear here automatically after the next login.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-xs">
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                    <th className="px-3 py-2 font-medium">IP address</th>
                    <th className="px-3 py-2 font-medium">Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-border/40 hover:bg-accent/30 border-b">
                      <td className="text-muted-foreground px-3 py-2 text-xs whitespace-nowrap">
                        {formatDateTimeBD(e.createdAt)}
                      </td>
                      <td className="px-3 py-2">{e.email}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={e.success ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {e.success ? "Success" : "Failed"}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                        {e.ip || "—"}
                      </td>
                      <td
                        className="text-muted-foreground max-w-[220px] truncate px-3 py-2 text-xs"
                        title={e.userAgent}
                      >
                        {e.userAgent || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Repeated failed attempts from the same IP may indicate a brute-force attack — consider
        rotating your admin password if you see unexpected failures.
      </p>
    </div>
  );
}
