"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DbTestimonial } from "@/types/testimonial";
import {
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
} from "@/lib/testimonials/actions";
import { createTestimonialSchema } from "@/lib/validation";
import { TESTIMONIAL_STATUSES } from "@/types/testimonial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";

interface FormFields {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: string;
  avatar: string;
  display_order: string;
  status: string;
}

function defaultFields(testimonial?: DbTestimonial): FormFields {
  return {
    name: testimonial?.name ?? "",
    role: testimonial?.role ?? "",
    company: testimonial?.company ?? "",
    quote: testimonial?.quote ?? "",
    rating: String(testimonial?.rating ?? 5),
    avatar: testimonial?.avatar ?? "",
    display_order: String(testimonial?.display_order ?? 0),
    status: testimonial?.status ?? "draft",
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  return {
    name: fields.name,
    role: fields.role,
    company: fields.company || null,
    quote: fields.quote,
    rating: Number(fields.rating) || 5,
    avatar: fields.avatar || null,
    display_order: Number(fields.display_order) || 0,
    status: fields.status,
  };
}

interface TestimonialFormProps {
  testimonial?: DbTestimonial;
}

export function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const router = useRouter();
  const mode = testimonial ? "edit" : "create";
  const initial = React.useMemo(() => defaultFields(testimonial), [testimonial]);
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const toast = useToast();

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
  );

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => ({ ...prev, ...partial }));
  }

  function validate(): boolean {
    const result = createTestimonialSchema.safeParse(fieldsToJson(fields));
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
        const result = await createTestimonialAction(fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Testimonial created successfully.");
        router.push("/admin/testimonials");
      } else {
        const result = await updateTestimonialAction(testimonial!.id, fieldsToJson(fields));
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Testimonial saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!testimonial) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      const result = await deleteTestimonialAction(testimonial.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Testimonial deleted.");
      router.push("/admin/testimonials");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/testimonials");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="border-border/40 flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {mode === "create" ? "New Testimonial" : "Edit Testimonial"}
            </CardTitle>
            {testimonial && (
              <Badge
                variant="outline"
                className={
                  testimonial.status === "published"
                    ? "border-emerald-500/30 text-emerald-500"
                    : "border-amber-500/30 text-amber-500"
                }
              >
                {testimonial.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={fields.name}
                onChange={(e) => handleChange({ name: e.target.value })}
                placeholder="Sarah Johnson"
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={fields.role}
                onChange={(e) => handleChange({ role: e.target.value })}
                placeholder="Operations Director"
              />
              {errors.role && <p className="text-destructive text-xs">{errors.role}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={fields.company}
                onChange={(e) => handleChange({ company: e.target.value })}
                placeholder="Northwind Logistics (optional)"
              />
              {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <select
                  id="rating"
                  value={fields.rating}
                  onChange={(e) => handleChange({ rating: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {"★".repeat(value)} {value}/5
                    </option>
                  ))}
                </select>
                {errors.rating && <p className="text-destructive text-xs">{errors.rating}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={fields.status}
                  onChange={(e) => handleChange({ status: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none"
                >
                  {TESTIMONIAL_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                value={fields.avatar}
                onChange={(e) => handleChange({ avatar: e.target.value })}
                placeholder="media:00000000-0000-0000-0000-000000000000 or https://..."
              />
              <p className="text-muted-foreground text-xs">
                Optional. Use a media library file reference or a direct image URL. Initials are
                shown when empty.
              </p>
              {errors.avatar && <p className="text-destructive text-xs">{errors.avatar}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={fields.display_order}
                onChange={(e) => handleChange({ display_order: e.target.value })}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">Lower numbers appear first.</p>
              {errors.display_order && (
                <p className="text-destructive text-xs">{errors.display_order}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Quote</Label>
            <textarea
              id="quote"
              value={fields.quote}
              onChange={(e) => handleChange({ quote: e.target.value })}
              placeholder="Azhar transformed our manual workflows into a system that practically runs itself."
              rows={4}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
            />
            <div className="flex justify-between">
              <p className="text-muted-foreground text-xs">
                Shown in the carousel on the homepage.
              </p>
              <p className="text-muted-foreground text-xs">{fields.quote.length}/2000</p>
            </div>
            {errors.quote && <p className="text-destructive text-xs">{errors.quote}</p>}
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
                ? "Create Testimonial"
                : fields.status === "published"
                  ? "Save Changes"
                  : "Save Draft"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete testimonial"
        description={`Are you sure you want to delete the testimonial from "${testimonial?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
