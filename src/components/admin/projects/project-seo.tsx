"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaField } from "@/components/media/media-field";
import type { FormFields } from "./project-form";

interface SeoSectionProps {
  fields: FormFields;
  errors?: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

export function ProjectSeo({ fields, errors, onChange }: SeoSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO Title</Label>
          <Input
            id="seo_title"
            value={fields.seo_title}
            onChange={(e) => onChange({ seo_title: e.target.value })}
            placeholder="Optional — defaults to project title"
          />
          <div className="flex justify-between">
            <p className="text-muted-foreground text-xs">Recommended: 50–70 characters</p>
            <p className="text-muted-foreground text-xs">{fields.seo_title.length}/70</p>
          </div>
          {errors?.seo_title && <p className="text-xs text-red-500">{errors.seo_title}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="canonical_url">Canonical URL</Label>
          <Input
            id="canonical_url"
            value={fields.canonical_url}
            onChange={(e) => onChange({ canonical_url: e.target.value })}
            placeholder="https://example.com/projects/my-project"
          />
          {errors?.canonical_url && <p className="text-xs text-red-500">{errors.canonical_url}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seo_description">SEO Description</Label>
        <textarea
          id="seo_description"
          value={fields.seo_description}
          onChange={(e) => onChange({ seo_description: e.target.value })}
          placeholder="Optional — defaults to short description"
          rows={3}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
        />
        <div className="flex justify-between">
          <p className="text-muted-foreground text-xs">Recommended: 150–160 characters</p>
          <p className="text-muted-foreground text-xs">{fields.seo_description.length}/160</p>
        </div>
        {errors?.seo_description && (
          <p className="text-xs text-red-500">{errors.seo_description}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <MediaField
            label="OpenGraph Image"
            description="Recommended: 1200×630px."
            value={fields.og_image}
            onChange={(value) => onChange({ og_image: value ?? "" })}
            previewClassName="aspect-video w-full max-w-xs"
          />
          {errors?.og_image && <p className="text-xs text-red-500">{errors.og_image}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            value={fields.keywords}
            onChange={(e) => onChange({ keywords: e.target.value })}
            placeholder="AI, automation, fleet management"
          />
          <p className="text-muted-foreground text-xs">Comma-separated keywords.</p>
          {errors?.keywords && <p className="text-xs text-red-500">{errors.keywords}</p>}
        </div>
      </div>
    </div>
  );
}
