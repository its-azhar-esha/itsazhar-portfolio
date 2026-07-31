"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/types/media";
import {
  formatBytes,
  formatDate,
  formatDimensions,
  getMediaKind,
  kindLabel,
} from "@/lib/media/utils";
import { MediaImage } from "./media-image";

interface MediaCardProps {
  media: MediaFile;
  onSelect?: (media: MediaFile) => void;
  selected?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function MediaCard({ media, onSelect, selected, actions, className }: MediaCardProps) {
  const kind = getMediaKind(media.mime_type);

  return (
    <div
      className={cn(
        "group border-border/40 bg-card hover:border-primary/30 relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-sm",
        selected && "border-primary ring-primary/20 ring-2",
        onSelect &&
          "focus-visible:ring-primary/40 cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      onClick={onSelect ? () => onSelect(media) : undefined}
      role={onSelect ? "button" : undefined}
      aria-label={onSelect ? media.original_name : undefined}
      aria-pressed={onSelect ? selected : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(media);
              }
            }
          : undefined
      }
    >
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        <MediaImage
          media={media}
          alt=""
          fill
          sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium" title={media.original_name}>
          {media.original_name}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
          {kindLabel(kind)}
          {media.width && media.height ? ` · ${formatDimensions(media.width, media.height)}` : ""}
          {" · "}
          {formatBytes(media.size_bytes)}
          {" · "}
          {formatDate(media.created_at)}
        </p>
      </div>
      {actions && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}
