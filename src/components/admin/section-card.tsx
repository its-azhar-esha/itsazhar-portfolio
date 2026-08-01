import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/ui/help-dialog";
import { cn } from "@/lib/utils";

/**
 * Shared admin section card with an icon, an optional help (?) button and an
 * optional trailing slot (e.g. a status badge). Server component — the help
 * button hydrates independently.
 */
export function SectionCard({
  title,
  icon: Icon,
  help,
  right,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  help?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pt-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="leading-tight">{title}</span>
          {help ? <HelpButton helpId={help} label={`Help about ${title}`} /> : null}
        </CardTitle>
        {right}
      </CardHeader>
      <CardContent className="px-4 pt-3 pb-4">{children}</CardContent>
    </Card>
  );
}
