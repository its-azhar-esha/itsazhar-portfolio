"use client";

import * as React from "react";
import { ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveMediaUrlAction } from "@/lib/media/actions";
import { isMediaReference, toMediaReference } from "@/lib/media/reference";
import { ALLOWED_DOCUMENT_MIME_TYPES, ALLOWED_VIDEO_MIME_TYPES } from "@/constants/media";
import type { MediaKind } from "@/types/media";
import { MediaImage } from "./media-image";
import { MediaPicker } from "./media-picker";
import { MediaUploader } from "./media-uploader";

interface MediaFieldProps {
  label?: string;
  description?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  previewClassName?: string;
  allowPasteUrl?: boolean;
  /** Restricts the picker/uploader to one media kind (e.g. "video"). */
  typeFilter?: MediaKind;
}

export function MediaField({
  label,
  description,
  value,
  onChange,
  previewClassName,
  allowPasteUrl = true,
  typeFilter,
}: MediaFieldProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteValue, setPasteValue] = React.useState("");

  const rawValue = value && value.trim() !== "" ? value.trim() : null;
  const missingReference = rawValue !== null && isMediaReference(rawValue) && previewUrl === null;

  const uploaderMimeTypes =
    typeFilter === "video"
      ? ALLOWED_VIDEO_MIME_TYPES
      : typeFilter === "document"
        ? ALLOWED_DOCUMENT_MIME_TYPES
        : undefined;

  React.useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await resolveMediaUrlAction(rawValue);
      if (!active) return;
      setPreviewUrl(resolved);
    })();
    return () => {
      active = false;
    };
  }, [rawValue]);

  function handlePicked(id: string) {
    onChange(toMediaReference(id));
    setPickerOpen(false);
  }

  function handleUploaded(media: { id: string }[]) {
    if (media.length > 0) {
      onChange(toMediaReference(media[0].id));
      setUploadOpen(false);
    }
  }

  function applyPasteUrl() {
    const url = pasteValue.trim();
    if (!url) return;
    onChange(url);
    setPasteValue("");
    setPasteOpen(false);
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      {description && <p className="text-muted-foreground -mt-1 text-xs">{description}</p>}

      {previewUrl ? (
        <div
          className={`bg-muted/40 border-border/40 relative w-full overflow-hidden rounded-lg border ${previewClassName ?? "aspect-video max-w-xs"}`}
        >
          {typeFilter === "video" ? (
            <video
              src={previewUrl}
              controls
              preload="metadata"
              className="h-full w-full object-contain"
            />
          ) : (
            <MediaImage
              src={previewUrl}
              alt={label ?? "Selected media"}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
            />
          )}
        </div>
      ) : rawValue ? (
        <div className="border-destructive/40 flex w-full max-w-xs flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-4 text-center">
          <ImageIcon className="text-muted-foreground h-5 w-5" />
          <p className="text-muted-foreground text-xs">
            {missingReference ? "This media reference no longer exists." : "Preview unavailable."}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="gap-1.5"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Choose Existing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen((open) => !open)}
          className="gap-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload New
        </Button>
        {allowPasteUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPasteValue(rawValue && !isMediaReference(rawValue) ? rawValue : "");
              setPasteOpen((open) => !open);
            }}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Paste URL
          </Button>
        )}
        {rawValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="gap-1.5 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      {uploadOpen && (
        <div className="max-w-md">
          <MediaUploader
            multiple={false}
            acceptMimeTypes={uploaderMimeTypes}
            onUploaded={handleUploaded}
            onError={() => undefined}
          />
        </div>
      )}

      {pasteOpen && (
        <div className="flex max-w-md items-center gap-2">
          <Input
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            aria-label="Paste image URL"
            className="h-9 flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={applyPasteUrl}>
            Apply
          </Button>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        typeFilter={typeFilter}
        onSelect={(media) => handlePicked(media.id)}
      />
    </div>
  );
}
