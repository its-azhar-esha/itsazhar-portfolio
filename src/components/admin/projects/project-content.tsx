"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { FormFields } from "./project-form";

interface ContentSectionProps {
  fields: FormFields;
  errors: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

const textareaClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

function WorkflowStepsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (steps: string[]) => void;
}) {
  function updateStep(index: number, text: string) {
    onChange(value.map((step, i) => (i === index ? text : step)));
  }

  function addStep() {
    onChange([...value, ""]);
  }

  function removeStep(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {value.map((step, index) => (
          <div
            key={index}
            className="border-border/50 bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-bold">
              {index + 1}
            </span>
            <Input
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              placeholder={`Workflow step ${index + 1}`}
              className="h-9 flex-1"
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                aria-label={`Move step ${index + 1} up`}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                onClick={() => moveStep(index, 1)}
                disabled={index === value.length - 1}
                aria-label={`Move step ${index + 1} down`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={() => removeStep(index)}
                aria-label={`Remove step ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addStep}>
        <Plus className="h-3.5 w-3.5" />
        Add step
      </Button>
    </div>
  );
}

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
        <WorkflowStepsEditor
          value={fields.workflow}
          onChange={(workflow) => onChange({ workflow })}
        />
        <p className="text-muted-foreground text-xs">
          Ordered steps rendered as a timeline. Use the arrows to reorder; each step is editable and
          removable.
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
