"use client";

import * as React from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFilesSelected, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleClick() {
    if (!disabled) inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFilesSelected(files);
    e.target.value = "";
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-border/40 hover:border-primary/40 hover:bg-accent/30"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
        <Upload className="text-primary h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="text-muted-foreground mt-1 text-xs">
          JPG, PNG, WebP, SVG, MP4, WebM, MOV — up to 20 MB each
        </p>
      </div>
    </div>
  );
}
