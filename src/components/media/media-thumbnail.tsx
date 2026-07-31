"use client";

import { cn } from "@/lib/utils";
import type { MediaFile } from "@/types/media";
import { MediaImage } from "./media-image";

interface MediaThumbnailProps {
  media?: MediaFile | null;
  src?: string;
  alt?: string;
  className?: string;
}

export function MediaThumbnail({ media, src, alt, className }: MediaThumbnailProps) {
  return (
    <div className={cn("relative h-10 w-10 shrink-0 overflow-hidden rounded-md", className)}>
      <MediaImage media={media} src={src} alt={alt} fill sizes="40px" />
    </div>
  );
}
