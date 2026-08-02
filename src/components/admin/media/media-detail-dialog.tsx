"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteMediaAction,
  getMediaUsageAction,
  replaceMediaReferenceAction,
  updateMediaMetadataAction,
} from "@/lib/media/actions";
import { replaceMediaFile } from "@/lib/media/upload";
import { toMediaReference } from "@/lib/media/reference";
import { formatBytes, formatDimensions, getMediaKind, kindLabel } from "@/lib/media/utils";
import { formatDateBD } from "@/lib/format/dates";
import { MEDIA_VALIDATION } from "@/constants/media";
import type { MediaFile, MediaUsageItem } from "@/types/media";
import { MediaImage } from "@/components/media/media-image";
import { MediaPicker } from "@/components/media/media-picker";
import { cn } from "@/lib/utils";

interface MediaDetailDialogProps {
  open: boolean;
  media: MediaFile | null;
  onClose: () => void;
  onChanged: (media: MediaFile) => void;
  onDeleted: (id: string) => void;
}

export function MediaDetailDialog({
  open,
  media,
  onClose,
  onChanged,
  onDeleted,
}: MediaDetailDialogProps) {
  return (
    <AnimatePresence>
      {open && media && (
        <MediaDetailForm
          key={`${media.id}-${media.updated_at}`}
          media={media}
          onClose={onClose}
          onChanged={onChanged}
          onDeleted={onDeleted}
        />
      )}
    </AnimatePresence>
  );
}

const KIND_TITLE: Record<string, string> = {
  hero: "Hero",
  about: "About",
  project: "Projects",
  seo: "SEO",
  content: "Content",
};

function MediaDetailForm({
  media,
  onClose,
  onChanged,
  onDeleted,
}: {
  media: MediaFile;
  onClose: () => void;
  onChanged: (media: MediaFile) => void;
  onDeleted: (id: string) => void;
}) {
  const kind = getMediaKind(media.mime_type);
  const reference = toMediaReference(media.id);

  const [name, setName] = React.useState(media.original_name);
  const [altText, setAltText] = React.useState(media.alt_text ?? "");
  const [caption, setCaption] = React.useState(media.caption ?? "");
  const [folder, setFolder] = React.useState(media.folder);
  const [tags, setTags] = React.useState(media.tags.join(", "));
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<"url" | "ref" | null>(null);
  const [usage, setUsage] = React.useState<MediaUsageItem[] | null>(null);
  const [usageError, setUsageError] = React.useState<string | null>(null);
  const [deleteArmed, setDeleteArmed] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [replacePickerOpen, setReplacePickerOpen] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  const usageCount = React.useMemo(
    () => (usage ?? []).reduce((total, item) => total + item.fields.length, 0),
    [usage],
  );

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    nameInputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const result = await getMediaUsageAction(reference);
      if (!active) return;
      if (result.success) {
        setUsage(result.data);
      } else {
        setUsageError(result.error);
        setUsage([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [reference]);

  function flashCopied(which: "url" | "ref") {
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyValue(value: string, which: "url" | "ref") {
    try {
      await navigator.clipboard.writeText(value);
      flashCopied(which);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  async function handleSaveMetadata() {
    setSaving(true);
    setSaveError(null);
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const result = await updateMediaMetadataAction(media.id, {
      original_name: name,
      alt_text: altText,
      caption,
      folder,
      tags: parsedTags,
    });
    if (result.success) {
      onChanged(result.data);
    } else {
      setSaveError(result.error);
    }
    setSaving(false);
  }

  async function handleReplaceFile(file: File | null) {
    setFileError(null);
    if (!file) return;
    setReplacing(true);
    const result = await replaceMediaFile(file, media);
    setReplacing(false);
    if (result.success) {
      onChanged(result.data);
    } else {
      setFileError(result.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteMediaAction(media.id);
    if (result.success) {
      onDeleted(media.id);
      onClose();
    } else {
      setDeleting(false);
      setFileError(result.error);
    }
  }

  async function handleReplaceReferencesAndDelete(replacement: MediaFile) {
    if (replacement.id === media.id) {
      setFileError("Please choose a different media item to replace with.");
      return;
    }
    setReplacePickerOpen(false);
    setDeleting(true);
    const replaceResult = await replaceMediaReferenceAction(
      reference,
      toMediaReference(replacement.id),
    );
    if (!replaceResult.success) {
      setDeleting(false);
      setFileError(replaceResult.error);
      return;
    }
    const deleteResult = await deleteMediaAction(media.id);
    setDeleting(false);
    if (deleteResult.success) {
      onDeleted(media.id);
      onClose();
    } else {
      setFileError(deleteResult.error);
    }
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
        aria-labelledby="media-detail-title"
        className="border-border/50 bg-background relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-xl"
      >
        <div className="border-border/40 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h3 id="media-detail-title" className="text-sm font-semibold">
              Media details
            </h3>
            <p
              className="text-muted-foreground mt-0.5 truncate text-xs"
              title={media.original_name}
            >
              {media.original_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="bg-muted/40 border-border/40 relative aspect-video w-full overflow-hidden rounded-lg border">
              {kind === "image" ? (
                <MediaImage media={media} alt={media.alt_text ?? media.original_name} fill />
              ) : kind === "video" && media.public_url ? (
                <video
                  src={media.public_url}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <FileText className="text-muted-foreground h-8 w-8" />
                  <p className="text-muted-foreground text-xs">
                    {media.original_name}
                    {media.public_url ? (
                      <a
                        href={media.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {" "}
                        — Open file
                      </a>
                    ) : null}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">File type</span>
                <span className="font-medium">
                  {kindLabel(kind)} ({media.mime_type})
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">File size</span>
                <span className="font-medium">{formatBytes(media.size_bytes)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">Dimensions</span>
                <span className="font-medium">{formatDimensions(media.width, media.height)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">Uploaded</span>
                <span className="font-medium">{formatDateBD(media.created_at)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{formatDateBD(media.updated_at)}</span>
              </p>
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground shrink-0">Reference</span>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <code className="text-muted-foreground truncate">{reference}</code>
                    <button
                      onClick={() => copyValue(reference, "ref")}
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      aria-label="Copy reference"
                    >
                      {copied === "ref" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {media.public_url && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">URL</span>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="text-muted-foreground truncate">{media.public_url}</span>
                      <button
                        onClick={() => copyValue(media.public_url!, "url")}
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        aria-label="Copy URL"
                      >
                        {copied === "url" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={media.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        aria-label="Open URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border/40 rounded-lg border p-4">
            <h4 className="text-xs font-semibold">Edit metadata</h4>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="media-name" className="text-xs font-medium">
                  Name
                </Label>
                <Input
                  ref={nameInputRef}
                  id="media-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MEDIA_VALIDATION.ORIGINAL_NAME_MAX}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-alt" className="text-xs font-medium">
                  Alt text
                </Label>
                <Input
                  id="media-alt"
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
                <Label htmlFor="media-caption" className="text-xs font-medium">
                  Caption
                </Label>
                <Textarea
                  id="media-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional caption shown with the image"
                  rows={2}
                  maxLength={MEDIA_VALIDATION.CAPTION_MAX}
                />
                <p className="text-muted-foreground text-right text-[10px]">
                  {caption.length}/{MEDIA_VALIDATION.CAPTION_MAX}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-folder" className="text-xs font-medium">
                  Folder
                </Label>
                <Input
                  id="media-folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="media"
                />
                <p className="text-muted-foreground text-[10px]">
                  Group related files together. Empty = &ldquo;media&rdquo; (root).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-tags" className="text-xs font-medium">
                  Tags
                </Label>
                <Input
                  id="media-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="portrait, hero, client-work"
                />
                <p className="text-muted-foreground text-[10px]">
                  Comma-separated. Used to find files quickly.
                </p>
              </div>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
                  {saving ? "Saving..." : "Save metadata"}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-border/40 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold">Used in</h4>
              {usage === null && !usageError && (
                <RefreshCw className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
              )}
            </div>
            {usageError ? (
              <p className="text-muted-foreground mt-2 text-xs">{usageError}</p>
            ) : usage === null ? (
              <p className="text-muted-foreground mt-2 text-xs">Checking usage...</p>
            ) : usage.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-xs">Not used anywhere yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-muted-foreground text-xs">
                  This media is used in{" "}
                  <span className="text-foreground font-medium">
                    {usageCount} place{usageCount === 1 ? "" : "s"}
                  </span>
                  .
                </p>
                {usage.map((item) => (
                  <div key={`${item.kind}-${item.id}`}>
                    <p className="text-xs font-medium">{KIND_TITLE[item.kind] ?? item.kind}</p>
                    <p className="text-muted-foreground text-xs">
                      <span className="font-medium">{item.title}</span>
                      {" — "}
                      {item.fields.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-border/40 rounded-lg border border-dashed p-4">
            <h4 className="text-xs font-semibold">Replace file</h4>
            <p className="text-muted-foreground mt-1 text-xs">
              Upload a new file for this media item. The reference (media:{media.id.slice(0, 8)}…)
              stays the same everywhere it is used.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                handleReplaceFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={replacing}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                {replacing ? "Replacing..." : "Choose new file"}
              </Button>
              {fileError && <p className="text-xs text-red-500">{fileError}</p>}
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg border p-4",
              deleteArmed ? "border-red-500/40" : "border-red-500/20",
            )}
          >
            <h4 className="text-xs font-semibold text-red-500">Delete media</h4>
            {deleteArmed ? (
              <div className="mt-3 space-y-3">
                {usageCount > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs text-red-500">
                      This media is currently used in {usageCount} place
                      {usageCount === 1 ? "" : "s"}. Deleting it may break those references.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplacePickerOpen(true)}
                    disabled={deleting}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace references
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Deleting..." : "Delete anyway"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteArmed(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteArmed(true)}
                  className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete media
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="border-border/40 flex justify-end gap-3 border-t px-5 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <MediaPicker
          open={replacePickerOpen}
          onClose={() => setReplacePickerOpen(false)}
          onSelect={handleReplaceReferencesAndDelete}
          typeFilter={kind}
        />
      </motion.div>
    </div>
  );
}
