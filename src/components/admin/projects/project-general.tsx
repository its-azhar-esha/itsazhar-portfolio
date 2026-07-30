"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PROJECT_INDUSTRIES, PROJECT_CATEGORIES, DB_PROJECT_STATUSES } from "@/constants/projects";
import type { FormFields } from "./project-form";

interface GeneralSectionProps {
  fields: FormFields;
  errors: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

export function ProjectGeneral({ fields, errors, onChange }: GeneralSectionProps) {
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
          <div className="border-border/40 grid grid-cols-2 gap-2 rounded-lg border p-3">
            {PROJECT_INDUSTRIES.map((ind) => {
              const checked = fields.industry.includes(ind);
              return (
                <label
                  key={ind}
                  className="hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? fields.industry.filter((i) => i !== ind)
                        : [...fields.industry, ind];
                      onChange({ industry: next });
                    }}
                    className="border-border text-primary focus:ring-primary/20 h-4 w-4 rounded"
                  />
                  {ind}
                </label>
              );
            })}
          </div>
          {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={fields.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
          >
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technologies">Technologies</Label>
        <Input
          id="technologies"
          value={fields.technologies}
          onChange={(e) => onChange({ technologies: e.target.value })}
          placeholder="n8n, Supabase, OpenAI, React"
        />
        <p className="text-muted-foreground text-xs">Comma-separated list of technologies used.</p>
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
