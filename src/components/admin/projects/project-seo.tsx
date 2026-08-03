"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { MediaField } from "@/components/media/media-field";
import { SeoPreview } from "@/components/admin/seo/seo-preview";
import { SeoAnalysisPanel } from "@/components/admin/seo/seo-analysis";
import { analyzeSeo } from "@/lib/seo/analysis";
import { SITE_URL } from "@/lib/site";
import type { FormFields } from "./project-form";

interface SeoSectionProps {
  fields: FormFields;
  errors?: Partial<Record<keyof FormFields, string>>;
  onChange: (fields: Partial<FormFields>) => void;
}

function CharCount({
  current,
  max,
  recommended,
}: {
  current: number;
  max: number;
  recommended?: [number, number];
}) {
  let color = "text-muted-foreground";
  if (current > max) color = "text-red-500";
  else if (recommended && current >= recommended[0] && current <= recommended[1])
    color = "text-emerald-500";
  else if (recommended && current > recommended[1]) color = "text-amber-500";

  return (
    <div className="flex justify-between">
      {recommended && (
        <p className="text-muted-foreground text-xs">
          Recommended: {recommended[0]}–{recommended[1]} characters
        </p>
      )}
      {!recommended && <p className="text-muted-foreground text-xs" />}
      <p className={`text-xs font-medium ${color}`}>
        {current}/{max}
      </p>
    </div>
  );
}

export function ProjectSeo({ fields, errors, onChange }: SeoSectionProps) {
  const analysis = React.useMemo(
    () =>
      analyzeSeo({
        title: fields.seo_title,
        description: fields.seo_description,
        ogImage: fields.og_image,
        keywords: fields.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      }),
    [fields.seo_title, fields.seo_description, fields.og_image, fields.keywords],
  );

  return (
    <div className="space-y-6">
      <SeoPreview
        title={fields.seo_title || fields.title}
        description={fields.seo_description || fields.short_description}
        url={`${SITE_URL}/projects/${fields.slug}`}
      />

      <SeoAnalysisPanel
        overall={analysis.overall}
        items={[
          { label: "Title", item: analysis.title },
          { label: "Description", item: analysis.description },
          { label: "OG Image", item: analysis.ogImage },
          { label: "Keywords", item: analysis.keywords },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO Title</Label>
          <Input
            id="seo_title"
            value={fields.seo_title}
            onChange={(e) => onChange({ seo_title: e.target.value })}
            placeholder="Optional — defaults to project title"
          />
          <CharCount current={fields.seo_title.length} max={70} recommended={[50, 60]} />
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
          <p className="text-muted-foreground text-xs">
            {fields.canonical_url
              ? "Custom canonical URL set."
              : "Defaults to the project page URL."}
          </p>
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
        <CharCount current={fields.seo_description.length} max={160} recommended={[150, 155]} />
        {errors?.seo_description && (
          <p className="text-xs text-red-500">{errors.seo_description}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <MediaField
            label="OpenGraph Image"
            description="Recommended: 1200×630px. Used when the page is shared on social media."
            value={fields.og_image}
            onChange={(value) => onChange({ og_image: value ?? "" })}
            previewClassName="aspect-video w-full max-w-xs"
          />
          {errors?.og_image && <p className="text-xs text-red-500">{errors.og_image}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <TagInput
            id="keywords"
            value={
              fields.keywords
                ? fields.keywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean)
                : []
            }
            onChange={(tags) => onChange({ keywords: tags.join(", ") })}
            placeholder="Type a keyword and press Enter"
            hint="Press Enter or comma to add, Backspace to remove, double-click a tag to edit. Paste a list to split automatically."
            error={errors?.keywords}
          />
        </div>
      </div>
    </div>
  );
}
