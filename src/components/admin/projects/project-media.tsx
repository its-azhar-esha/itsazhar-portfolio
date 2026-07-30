"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, X, Video } from "lucide-react";
import { MediaPicker } from "@/components/admin/media/media-picker";
import type { FormFields } from "./project-form";

interface MediaSectionProps {
  fields: FormFields;
  onChange: (fields: Partial<FormFields>) => void;
}

export function ProjectMedia({ fields, onChange }: MediaSectionProps) {
  const [pickerField, setPickerField] = React.useState<"thumbnail" | "gallery" | "video" | null>(
    null,
  );

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
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail</Label>
        <div className="flex gap-2">
          <Input
            id="thumbnail"
            value={fields.thumbnail}
            onChange={(e) => onChange({ thumbnail: e.target.value })}
            placeholder="https://example.com/thumbnail.jpg"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPickerField("thumbnail")}
            title="Select from media library"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
        {fields.thumbnail && (
          <div className="bg-muted relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg">
            <img
              src={fields.thumbnail}
              alt="Thumbnail preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Gallery Images</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerField("gallery")}
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
                <img
                  src={url}
                  alt={`Gallery image ${i + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
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
        <div className="flex gap-2">
          <Input
            id="video_url"
            value={fields.video_url}
            onChange={(e) => onChange({ video_url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPickerField("video")}
            title="Select from media library"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MediaPicker
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        onSelect={(url) => {
          if (pickerField === "thumbnail") onChange({ thumbnail: url });
          else if (pickerField === "gallery") addToGallery(url);
          else if (pickerField === "video") onChange({ video_url: url });
          setPickerField(null);
        }}
      />
    </div>
  );
}
