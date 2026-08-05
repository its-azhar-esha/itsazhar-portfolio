"use client";

import * as React from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
  MIME_EXTENSIONS,
} from "@/constants/media";
import { uploadMediaFile, validateMediaFile } from "@/lib/media/upload";
import { formatBytes, getMediaKind, kindLabel } from "@/lib/media/utils";
import type { MediaFile } from "@/types/media";

interface UploadItem {
  id: string;
  name: string;
  percent: number;
  status: "uploading" | "success" | "error";
  message?: string;
  previewUrl?: string;
}

interface MediaUploaderProps {
  multiple?: boolean;
  folder?: string;
  tags?: string[];
  /** Restricts which files the picker/validation accept (defaults to all supported types). */
  acceptMimeTypes?: readonly string[];
  onUploaded?: (media: MediaFile[]) => void;
  onError?: (message: string) => void;
  className?: string;
}

export function MediaUploader({
  multiple = true,
  folder,
  tags,
  acceptMimeTypes = ALLOWED_MEDIA_MIME_TYPES,
  onUploaded,
  onError,
  className,
}: MediaUploaderProps) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const acceptedKinds = React.useMemo(
    () => [...new Set(acceptMimeTypes.map((mime) => getMediaKind(mime)))],
    [acceptMimeTypes],
  );
  const acceptedLabel =
    acceptedKinds.length === 1
      ? acceptMimeTypes
          .map((mime) => MIME_EXTENSIONS[mime])
          .filter(Boolean)
          .join(", ")
          .toUpperCase()
      : acceptedKinds.map((kind) => kindLabel(kind)).join(", ");

  React.useEffect(() => {
    return () => {
      for (const item of items) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(files: File[]) {
    const accepted = multiple ? files : files.slice(0, 1);

    const queued: { file: File; id: string; previewUrl?: string }[] = [];
    for (const file of accepted) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const restricted =
        acceptMimeTypes.length > 0 && !acceptMimeTypes.includes(file.type as never)
          ? `Unsupported file type "${file.type || "unknown"}".`
          : null;
      const error = restricted ?? validateMediaFile(file);
      if (error) {
        setItems((prev) => [
          ...prev,
          { id, name: file.name, percent: 0, status: "error", message: error },
        ]);
        continue;
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      setItems((prev) => [
        ...prev,
        { id, name: file.name, percent: 0, status: "uploading", previewUrl },
      ]);
      queued.push({ file, id, previewUrl });
    }

    if (queued.length === 0) return;
    setBusy(true);

    const uploaded: MediaFile[] = [];
    for (const { file, id, previewUrl } of queued) {
      const result = await uploadMediaFile(file, {
        onProgress: ({ percent }) => updateItem(id, { percent }),
        folder,
        tags,
      });
      if (result.success) {
        updateItem(id, { status: "success", percent: 100 });
        uploaded.push(result.data);
      } else {
        updateItem(id, { status: "error", message: result.error });
        onError?.(result.error);
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }

    setBusy(false);
    if (uploaded.length > 0) onUploaded?.(uploaded);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    e.target.value = "";
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload images. Drop files here or press Enter to browse."
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-primary/40 hover:bg-accent/30",
          busy && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptMimeTypes.join(",")}
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Upload className="text-primary h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Drop files here or click to upload</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {acceptedLabel} — up to {formatBytes(MAX_MEDIA_FILE_SIZE_BYTES)} each
            {multiple ? ", multiple files allowed" : ""}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-border/40 bg-card flex items-center gap-3 rounded-lg border p-2.5"
            >
              {item.previewUrl ? (
                <Image
                  src={item.previewUrl}
                  alt={item.name}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                  {item.status === "uploading" ? (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  ) : item.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.name}</p>
                {item.status === "uploading" ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="bg-muted h-1 w-full max-w-[200px] overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-200 ease-out"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-9 text-right text-[10px]">
                      {item.percent}%
                    </span>
                  </div>
                ) : item.status === "error" ? (
                  <p className="mt-0.5 truncate text-[10px] text-red-500">{item.message}</p>
                ) : (
                  <p className="text-muted-foreground mt-0.5 text-[10px]">Uploaded</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
