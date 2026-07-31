"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMediaMetadataAction } from "@/lib/media/actions";
import { MEDIA_VALIDATION } from "@/constants/media";
import type { MediaFile } from "@/types/media";

interface MediaEditDialogProps {
  open: boolean;
  media: MediaFile | null;
  onClose: () => void;
  onSaved: (media: MediaFile) => void;
}

export function MediaEditDialog({ open, media, onClose, onSaved }: MediaEditDialogProps) {
  return (
    <AnimatePresence>
      {open && media && (
        <MediaEditForm key={media.id} media={media} onClose={onClose} onSaved={onSaved} />
      )}
    </AnimatePresence>
  );
}

function MediaEditForm({
  media,
  onClose,
  onSaved,
}: {
  media: MediaFile;
  onClose: () => void;
  onSaved: (media: MediaFile) => void;
}) {
  const [altText, setAltText] = React.useState(media.alt_text ?? "");
  const [caption, setCaption] = React.useState(media.caption ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const firstInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    firstInputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateMediaMetadataAction(media.id, { alt_text: altText, caption });
    if (result.success) {
      onSaved(result.data);
      onClose();
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-edit-title"
        className="border-border/50 bg-background relative z-10 w-full max-w-md rounded-xl border p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 id="media-edit-title" className="text-sm font-semibold">
          Edit media
        </h3>
        <p className="text-muted-foreground mt-1 truncate text-xs" title={media.original_name}>
          {media.original_name}
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="alt-text" className="text-xs font-medium">
              Alt text
            </Label>
            <Input
              ref={firstInputRef}
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
              maxLength={MEDIA_VALIDATION.ALT_TEXT_MAX}
            />
            <p className="text-muted-foreground text-right text-[10px]">
              {altText.length}/{MEDIA_VALIDATION.ALT_TEXT_MAX}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caption" className="text-xs font-medium">
              Caption
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption shown with the image"
              rows={3}
              maxLength={MEDIA_VALIDATION.CAPTION_MAX}
            />
            <p className="text-muted-foreground text-right text-[10px]">
              {caption.length}/{MEDIA_VALIDATION.CAPTION_MAX}
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
