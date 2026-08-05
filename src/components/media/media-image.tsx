"use client";

import Image from "next/image";
import { FileIcon, ImageIcon, MusicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/types/media";

interface MediaImageProps {
  media?: MediaFile | null;
  src?: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

/**
 * Shared image renderer for media library assets.
 * - Renders a placeholder for empty/missing media and non-image kinds.
 * - Uses next/image: pass `fill` when the parent is a sized, relative
 *   container (recommended); otherwise width/height are taken from the
 *   media record.
 */
export function MediaImage({
  media,
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority,
}: MediaImageProps) {
  const url = media?.public_url ?? src;
  const isImage = !media || media.mime_type.startsWith("image/");

  if (!url || !isImage) {
    return (
      <div
        aria-hidden="true"
        className={cn("bg-muted/50 flex items-center justify-center", className)}
      >
        {media && media.mime_type.startsWith("audio/") ? (
          <MusicIcon className="text-muted-foreground h-6 w-6" />
        ) : media && !isImage ? (
          <FileIcon className="text-muted-foreground h-6 w-6" />
        ) : (
          <ImageIcon className="text-muted-foreground h-6 w-6" />
        )}
      </div>
    );
  }

  const altText = alt ?? media?.alt_text ?? media?.original_name ?? "Media";

  if (fill) {
    return (
      <Image
        src={url}
        alt={altText}
        fill
        sizes={sizes ?? "(min-width: 768px) 33vw, 50vw"}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={altText}
      width={media?.width ?? 800}
      height={media?.height ?? 600}
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
