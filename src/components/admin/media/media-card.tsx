"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Trash2, File, Check } from "lucide-react";
import { staggerItem } from "@/lib/motion";
import type { MediaFile } from "@/lib/storage";

interface MediaCardProps {
  file: MediaFile;
  onSelect?: (url: string) => void;
  onDelete: (path: string) => void;
}

function getFileType(url: string): "image" | "video" | "other" {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "other";
}

function extractPath(url: string): string {
  const parts = url.split("/project-media/");
  return parts[1] || "";
}

export function MediaCard({ file, onSelect, onDelete }: MediaCardProps) {
  const [copied, setCopied] = React.useState(false);
  const fileType = getFileType(file.url);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const path = extractPath(file.url);
    if (path) onDelete(path);
  }

  return (
    <motion.div
      variants={staggerItem}
      className="group border-border/40 bg-card hover:border-primary/30 relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-sm"
    >
      <div className="bg-muted aspect-video w-full overflow-hidden">
        {fileType === "image" ? (
          <img
            src={file.url}
            alt={file.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : fileType === "video" ? (
          <video src={file.url} className="h-full w-full object-cover" preload="metadata" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <File className="text-muted-foreground h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[10px]">
          {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : ""}
        </p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="bg-background/90 text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={handleDelete}
          className="bg-background/90 text-muted-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {onSelect && (
        <button
          onClick={() => onSelect(file.url)}
          className="absolute inset-0 z-10"
          aria-label={`Select ${file.name}`}
        />
      )}
    </motion.div>
  );
}
