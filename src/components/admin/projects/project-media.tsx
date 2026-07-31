"use client";

import * as React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { MediaField } from "@/components/media/media-field";
import { MediaPicker } from "@/components/media/media-picker";
import { resolveMediaUrlAction } from "@/lib/media/actions";
import { toMediaReference } from "@/lib/media/reference";
import type { MediaFile } from "@/types/media";
import type { FormFields } from "./project-form";

interface MediaSectionProps {
  fields: FormFields;
  onChange: (fields: Partial<FormFields>) => void;
}

function ResolvedImage({
  value,
  alt,
  className,
}: {
  value: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    resolveMediaUrlAction(value).then((url) => {
      if (!active) return;
      if (url) setUrl(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!url) return null;
  return (
    <Image src={url} alt={alt} fill sizes="(min-width: 640px) 33vw, 50vw" className={className} />
  );
}

export function ProjectMedia({ fields, onChange }: MediaSectionProps) {
  const [galleryPickerOpen, setGalleryPickerOpen] = React.useState(false);

  const galleryUrls = React.useMemo(
    () => fields.images.split("\n").filter(Boolean),
    [fields.images],
  );

  function addToGallery(url: string) {
    const existing = fields.images.trim();
    onChange({ images: existing ? `${existing}\n${url}` : url });
  }

  function removeFromGallery(index: number) {
    const urls = galleryUrls.filter((_, i) => i !== index);
    onChange({ images: urls.join("\n") });
  }

  return (
    <div className="space-y-6">
      <MediaField
        label="Thumbnail"
        description="Cover image displayed on the project card."
        value={fields.thumbnail}
        onChange={(value) => onChange({ thumbnail: value ?? "" })}
        previewClassName="aspect-video w-full max-w-xs"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Gallery Images</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGalleryPickerOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Image
          </Button>
        </div>
        {galleryUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryUrls.map((url, i) => (
              <div
                key={i}
                className="group bg-muted relative aspect-video overflow-hidden rounded-lg"
              >
                <ResolvedImage
                  value={url}
                  alt={`Gallery image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFromGallery(i)}
                  className="bg-background/80 text-muted-foreground absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:opacity-100 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const urls = [...galleryUrls];
                    urls[i] = e.target.value;
                    onChange({ images: urls.join("\n") });
                  }}
                  className="border-border/40 bg-background/80 text-muted-foreground absolute right-0 bottom-0 left-0 border-t px-2 py-1 text-[10px] backdrop-blur-sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={fields.images}
            onChange={(e) => onChange({ images: e.target.value })}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            rows={4}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video_url">Intro Video URL</Label>
        <Input
          id="video_url"
          value={fields.video_url}
          onChange={(e) => onChange({ video_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <MediaPicker
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelect={(media: MediaFile) => {
          addToGallery(toMediaReference(media.id));
          setGalleryPickerOpen(false);
        }}
      />
    </div>
  );
}
