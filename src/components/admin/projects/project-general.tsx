"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PROJECT_INDUSTRIES, PROJECT_CATEGORIES, DB_PROJECT_STATUSES } from "@/constants/projects";
import type { FormFields } from "./project-form";

interface GeneralSectionProps {
  fields: FormFields;
  errors: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

export function ProjectGeneral({ fields, errors, onChange }: GeneralSectionProps) {
  const industryPresets = PROJECT_INDUSTRIES as readonly string[];
  const categoryPresets = PROJECT_CATEGORIES as readonly string[];

  const industryOptions = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...industryPresets,
          ...fields.industry.filter((i) => !industryPresets.includes(i)),
        ]),
      ),
    [fields.industry, industryPresets],
  );

  const categoryOptions = React.useMemo(
    () => Array.from(new Set([...categoryPresets, ...(fields.category ? [fields.category] : [])])),
    [fields.category, categoryPresets],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            value={fields.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Fleet Guard"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={fields.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            placeholder="e.g. fleet-guard"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Industry</Label>
          <SearchableSelect
            multiple
            options={industryOptions}
            value={fields.industry}
            onChange={(next) => onChange({ industry: next as string[] })}
            placeholder="Search industries or type to add..."
            searchPlaceholder="Search industries..."
            hint="Search the list, or type a custom industry and press Enter."
            maxSelections={20}
            id="industries"
          />
          {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <SearchableSelect
            options={categoryOptions}
            value={fields.category}
            onChange={(next) => onChange({ category: next as string })}
            placeholder="Pick a category or type a custom one"
            searchPlaceholder="Search categories..."
            hint="Search the list, or type a custom category and press Enter."
            id="category"
          />
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technologies">Technologies</Label>
        <TagInput
          id="technologies"
          value={
            fields.technologies
              ? fields.technologies
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : []
          }
          onChange={(tags) => onChange({ technologies: tags.join(", ") })}
          placeholder="Type a technology and press Enter"
          hint="Press Enter or comma to add, Backspace to remove, double-click a tag to edit. Paste a list to split automatically."
        />
        {errors.technologies && <p className="text-xs text-red-500">{errors.technologies}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client">Client Name</Label>
          <Input
            id="client"
            value={fields.client}
            onChange={(e) => onChange({ client: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            min={0}
            value={String(fields.order)}
            onChange={(e) => onChange({ order: parseInt(e.target.value) || 0 })}
          />
          <p className="text-muted-foreground text-xs">
            Tip: drag projects into place on the Projects list page — order updates automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="demo_url">Project URL</Label>
          <Input
            id="demo_url"
            value={fields.demo_url}
            onChange={(e) => onChange({ demo_url: e.target.value })}
            placeholder="https://example.com"
          />
          {errors.demo_url && <p className="text-xs text-red-500">{errors.demo_url}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL</Label>
          <Input
            id="github_url"
            value={fields.github_url}
            onChange={(e) => onChange({ github_url: e.target.value })}
            placeholder="https://github.com/user/repo"
          />
          {errors.github_url && <p className="text-xs text-red-500">{errors.github_url}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={fields.featured}
            onCheckedChange={(checked) => onChange({ featured: checked })}
          />
          <Label htmlFor="featured">Featured Project</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={fields.status}
            onChange={(e) => onChange({ status: e.target.value as FormFields["status"] })}
            className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
          >
            {DB_PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
