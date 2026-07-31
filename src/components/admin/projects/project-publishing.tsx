"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DB_PROJECT_STATUSES } from "@/constants/projects";
import type { FormFields } from "./project-form";

interface PublishingSectionProps {
  fields: FormFields;
  onChange: (fields: Partial<FormFields>) => void;
}

const statusDescriptions: Record<string, string> = {
  draft: "Visible only to you. Not listed on the public site.",
  active: "Published and visible on the public site.",
  archived: "Hidden from the public site but kept in the database.",
};

export function ProjectPublishing({ fields, onChange }: PublishingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Publishing Status</Label>
        <div className="grid gap-3">
          {DB_PROJECT_STATUSES.map((s) => {
            const selected = fields.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ status: s })}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/40 hover:border-border/80 hover:bg-accent/30"
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                    selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {selected && (
                    <div className="flex h-full items-center justify-center">
                      <div className="bg-background h-1.5 w-1.5 rounded-full" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{s}</span>
                    {selected && (
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary text-[10px]"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">{statusDescriptions[s]}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border/40 bg-muted/30 rounded-lg border p-4">
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">Scheduled publishing</span> — Coming in a
          future update. For now, set a project to &ldquo;Draft&rdquo; and publish it manually when
          ready.
        </p>
      </div>
    </div>
  );
}
