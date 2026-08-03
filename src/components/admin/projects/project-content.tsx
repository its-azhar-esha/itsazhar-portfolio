"use client";

import { Label } from "@/components/ui/label";
import type { FormFields } from "./project-form";
import { ListEditor } from "./list-editor";

interface ContentSectionProps {
  fields: FormFields;
  errors: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

const textareaClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

export function ProjectContent({ fields, errors, onChange }: ContentSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="short_description">Short Description</Label>
        <textarea
          id="short_description"
          value={fields.short_description}
          onChange={(e) => onChange({ short_description: e.target.value })}
          placeholder="Brief overview of the project (max 500 characters)"
          rows={3}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
        />
        <div className="flex justify-between">
          {errors.short_description && (
            <p className="text-xs text-red-500">{errors.short_description}</p>
          )}
          <p className="text-muted-foreground ml-auto text-xs">
            {fields.short_description.length}/500
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <textarea
          id="description"
          value={fields.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Detailed project description. Supports rich text."
          rows={12}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex min-h-[200px] w-full resize-y rounded-lg border px-3 py-2 text-sm leading-relaxed transition-all duration-200 focus:ring-1 focus:outline-none"
        />
        <p className="text-muted-foreground text-xs">
          Rich text editor can be added here in a future iteration.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="challenge">The Challenge</Label>
        <textarea
          id="challenge"
          value={fields.challenge}
          onChange={(e) => onChange({ challenge: e.target.value })}
          placeholder="Describe the problem the project set out to solve."
          rows={4}
          className={textareaClass}
        />
        {errors.challenge && <p className="text-xs text-red-500">{errors.challenge}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="solution">The Solution</Label>
        <textarea
          id="solution"
          value={fields.solution}
          onChange={(e) => onChange({ solution: e.target.value })}
          placeholder="Describe how the project solved the problem."
          rows={4}
          className={textareaClass}
        />
        {errors.solution && <p className="text-xs text-red-500">{errors.solution}</p>}
      </div>

      <div className="space-y-2">
        <Label>Workflow</Label>
        <ListEditor
          value={fields.workflow}
          onChange={(workflow) => onChange({ workflow })}
          placeholder="Workflow step"
        />
        <p className="text-muted-foreground text-xs">
          Ordered steps rendered as a timeline. Use the arrows to reorder; each step is editable and
          removable.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Key Features</Label>
        <ListEditor
          value={fields.key_features}
          onChange={(key_features) => onChange({ key_features })}
          placeholder="Key feature"
          emptyMessage="No key features added yet"
        />
        <p className="text-muted-foreground text-xs">
          Highlight the main features or capabilities of this project. Use the arrows to reorder.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Future Scope</Label>
        <ListEditor
          value={fields.future_scope}
          onChange={(future_scope) => onChange({ future_scope })}
          placeholder="Future item"
          emptyMessage="No future scope items added yet"
        />
        <p className="text-muted-foreground text-xs">
          Planned improvements, next steps, or features you intend to build. Use the arrows to
          reorder.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="impact">Impact & Outcome</Label>
        <textarea
          id="impact"
          value={fields.impact}
          onChange={(e) => onChange({ impact: e.target.value })}
          placeholder="Describe the measurable outcomes and results."
          rows={4}
          className={textareaClass}
        />
        {errors.impact && <p className="text-xs text-red-500">{errors.impact}</p>}
      </div>
    </div>
  );
}
