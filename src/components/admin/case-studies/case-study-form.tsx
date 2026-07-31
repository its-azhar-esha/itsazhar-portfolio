"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DbCaseStudy } from "@/types/case-study";
import {
  createCaseStudyAction,
  updateCaseStudyAction,
  deleteCaseStudyAction,
} from "@/lib/case-studies/actions";
import { createCaseStudySchema } from "@/lib/validation";
import { CASE_STUDY_ICON_NAMES, CASE_STUDY_STATUSES } from "@/constants/case-studies";
import { generateSlug } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface FormFields {
  slug: string;
  title: string;
  subtitle: string;
  challenge: string;
  solution: string;
  workflow: string[];
  impact: string;
  icon: string;
  display_order: string;
  status: string;
}

function defaultFields(caseStudy?: DbCaseStudy): FormFields {
  return {
    slug: caseStudy?.slug ?? "",
    title: caseStudy?.title ?? "",
    subtitle: caseStudy?.subtitle ?? "",
    challenge: caseStudy?.challenge ?? "",
    solution: caseStudy?.solution ?? "",
    workflow: caseStudy?.workflow ?? [],
    impact: caseStudy?.impact ?? "",
    icon: caseStudy?.icon ?? "fleet",
    display_order: String(caseStudy?.display_order ?? 0),
    status: caseStudy?.status ?? "draft",
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  return {
    slug: fields.slug,
    title: fields.title,
    subtitle: fields.subtitle,
    challenge: fields.challenge,
    solution: fields.solution,
    workflow: fields.workflow,
    impact: fields.impact,
    icon: fields.icon,
    display_order: Number(fields.display_order) || 0,
    status: fields.status,
  };
}

interface CaseStudyFormProps {
  caseStudy?: DbCaseStudy;
}

export function CaseStudyForm({ caseStudy }: CaseStudyFormProps) {
  const router = useRouter();
  const mode = caseStudy ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(caseStudy), [caseStudy]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const slugManuallyEdited = React.useRef(false);
  const toast = useToast();

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
  );

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => {
      const next = { ...prev, ...partial };
      if ("title" in partial && !slugManuallyEdited.current && partial.title) {
        const generated = generateSlug(partial.title);
        if (generated !== next.slug) {
          next.slug = generated;
        }
      }
      return next;
    });
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    handleChange({ slug: value });
  }

  function validate(): boolean {
    const result = createCaseStudySchema.safeParse(fieldsToJson(fields));
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormFields | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors before saving.");
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (mode === "create") {
        const result = await createCaseStudyAction(fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Case study created successfully.");
        router.push("/admin/case-studies");
      } else {
        const result = await updateCaseStudyAction(caseStudy!.id, fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Case study saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!caseStudy) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      const result = await deleteCaseStudyAction(caseStudy.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Case study deleted.");
      router.push("/admin/case-studies");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/case-studies");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="border-border/40 flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {mode === "create" ? "New Case Study" : "Edit Case Study"}
            </CardTitle>
            {caseStudy && (
              <Badge
                variant="outline"
                className={
                  caseStudy.status === "published"
                    ? "border-emerald-500/30 text-emerald-500"
                    : "border-amber-500/30 text-amber-500"
                }
              >
                {caseStudy.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={fields.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="Fleet Intelligence System"
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={fields.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="fleet-intelligence-system"
              />
              <p className="text-muted-foreground text-xs">
                Lowercase letters, numbers, and hyphens.
              </p>
              {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={fields.subtitle}
                onChange={(e) => handleChange({ subtitle: e.target.value })}
                placeholder="Logistics AI"
              />
              <p className="text-muted-foreground text-xs">Shown as a badge on the card.</p>
              {errors.subtitle && <p className="text-destructive text-xs">{errors.subtitle}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <select
                  id="icon"
                  value={fields.icon}
                  onChange={(e) => handleChange({ icon: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
                >
                  {CASE_STUDY_ICON_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.icon && <p className="text-destructive text-xs">{errors.icon}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={fields.status}
                  onChange={(e) => handleChange({ status: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
                >
                  {CASE_STUDY_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={fields.display_order}
                onChange={(e) => handleChange({ display_order: e.target.value })}
                placeholder="1"
              />
              <p className="text-muted-foreground text-xs">Lower numbers appear first.</p>
              {errors.display_order && (
                <p className="text-destructive text-xs">{errors.display_order}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenge">The Challenge</Label>
            <textarea
              id="challenge"
              value={fields.challenge}
              onChange={(e) => handleChange({ challenge: e.target.value })}
              placeholder="What was the manual process and why was it a problem?"
              rows={3}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            {errors.challenge && <p className="text-destructive text-xs">{errors.challenge}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">The Solution (Automation Approach)</Label>
            <textarea
              id="solution"
              value={fields.solution}
              onChange={(e) => handleChange({ solution: e.target.value })}
              placeholder="How did the automation system solve the problem?"
              rows={3}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            {errors.solution && <p className="text-destructive text-xs">{errors.solution}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow">Workflow Design</Label>
            <TagInput
              id="workflow"
              value={fields.workflow}
              onChange={(workflow) => handleChange({ workflow })}
              placeholder="Type a step and press Enter to add"
              hint="One step per tag"
            />
            {errors.workflow && <p className="text-destructive text-xs">{errors.workflow}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact">Business Impact</Label>
            <textarea
              id="impact"
              value={fields.impact}
              onChange={(e) => handleChange({ impact: e.target.value })}
              placeholder="What changed for the business after automation?"
              rows={3}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            {errors.impact && <p className="text-destructive text-xs">{errors.impact}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={mode !== "edit" || saving}
        >
          Delete
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || (mode === "edit" && !hasChanges)}>
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create Case Study"
                : fields.status === "published"
                  ? "Save Changes"
                  : "Save Draft"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete case study"
        description={`Are you sure you want to delete "${caseStudy?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
