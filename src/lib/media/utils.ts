import type { MediaKind } from "@/types/media";
import { ALLOWED_VIDEO_MIME_TYPES, MIME_EXTENSIONS } from "@/constants/media";

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXTENSIONS).filter(([mime]) =>
    (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime),
  ),
);

export function getVideoSourceType(url: string): string {
  const ext = url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_MIME_BY_EXTENSION[ext] ?? "video/mp4";
}

export function getMediaKind(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("text/") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType === "application/zip"
  ) {
    return "document";
  }
  return "other";
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatDimensions(width: number | null, height: number | null): string {
  if (!width || !height) return "—";
  return `${width} × ${height}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const KIND_LABELS: Record<MediaKind, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
  other: "File",
};

export function kindLabel(kind: MediaKind): string {
  return KIND_LABELS[kind];
}
