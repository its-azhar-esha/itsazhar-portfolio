"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImageOff,
  LayoutGrid,
  List,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMediaPageAction, deleteMediaAction } from "@/lib/media/actions";
import { MEDIA_DEFAULT_PAGE_SIZE, MEDIA_SORT_OPTIONS } from "@/constants/media";
import { formatBytes, formatDimensions } from "@/lib/media/utils";
import type { MediaFile, MediaSort } from "@/types/media";
import { MediaCard } from "@/components/media/media-card";
import { MediaThumbnail } from "@/components/media/media-thumbnail";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaEditDialog } from "./media-edit-dialog";
import { ConfirmDialog } from "@/components/admin/projects/confirm-dialog";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

interface MediaManagerProps {
  initialError?: string | null;
}

export function MediaManager({ initialError }: MediaManagerProps) {
  const [view, setView] = React.useState<ViewMode>("grid");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<MediaSort>("newest");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<MediaFile[]>([]);
  const [pageCount, setPageCount] = React.useState(1);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(initialError ?? null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<MediaFile | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaFile | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function fetchPage() {
    setLoading(true);
    setError(null);
    const result = await getMediaPageAction({
      search,
      sort,
      page,
      pageSize: MEDIA_DEFAULT_PAGE_SIZE,
    });
    if (result.success) {
      setItems(result.data.items);
      setCount(result.data.count);
      setPageCount(result.data.pageCount);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getMediaPageAction({
        search,
        sort,
        page,
        pageSize: MEDIA_DEFAULT_PAGE_SIZE,
      });
      if (!active) return;
      if (result.success) {
        setItems(result.data.items);
        setCount(result.data.count);
        setPageCount(result.data.pageCount);
      } else {
        setError(result.error);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [search, sort, page]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteMediaAction(deleteTarget.id);
    setDeleteTarget(null);
    if (result.success) {
      fetchPage();
    } else {
      setError(result.error);
    }
  }

  function handleCopy(media: MediaFile) {
    if (!media.public_url) return;
    navigator.clipboard.writeText(media.public_url);
    setCopiedId(media.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleUploaded() {
    setShowUpload(false);
    setPage(1);
    fetchPage();
  }

  const cardActions = (media: MediaFile) => (
    <>
      {media.public_url && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(media);
          }}
          className="bg-background/90 text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors"
          title="Copy URL"
          aria-label={`Copy URL for ${media.original_name}`}
        >
          {copiedId === media.id ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditTarget(media);
          setEditOpen(true);
        }}
        className="bg-background/90 text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors"
        title="Edit metadata"
        aria-label={`Edit metadata for ${media.original_name}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteTarget(media);
        }}
        className="bg-background/90 text-muted-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors hover:text-red-500"
        title="Delete"
        aria-label={`Delete ${media.original_name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, alt text or caption..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as MediaSort);
              setPage(1);
            }}
            className="border-border/40 bg-background hover:bg-accent/50 h-9 rounded-md border px-3 text-sm transition-colors outline-none"
            aria-label="Sort media"
          >
            {MEDIA_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="border-border/40 bg-background flex h-9 items-center rounded-md border p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded transition-colors",
                view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded transition-colors",
                view === "list" ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="mr-1.5 h-4 w-4" />
            {showUpload ? "Done" : "Upload"}
          </Button>
        </div>
      </div>

      {showUpload && (
        <MediaUploader multiple onUploaded={handleUploaded} onError={() => undefined} />
      )}

      {loading ? (
        view === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted aspect-video animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
            ))}
          </div>
        )
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ImageOff className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground mt-3 text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchPage}>
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ImageOff className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground mt-3 text-sm">
            {search ? "No media matches your search." : "No media uploaded yet."}
          </p>
          {!search && (
            <Button size="sm" className="mt-4" onClick={() => setShowUpload(true)}>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload your first image
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((media) => (
            <MediaCard key={media.id} media={media} actions={cardActions(media)} />
          ))}
        </div>
      ) : (
        <div className="border-border/40 overflow-hidden rounded-lg border">
          {items.map((media) => (
            <div
              key={media.id}
              className="border-border/40 hover:bg-accent/40 flex items-center gap-3 border-b p-3 transition-colors last:border-b-0"
            >
              <MediaThumbnail media={media} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={media.original_name}>
                  {media.original_name}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {media.mime_type} · {formatBytes(media.size_bytes)} ·{" "}
                  {formatDimensions(media.width, media.height)} ·{" "}
                  {new Date(media.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">{cardActions(media)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {count} {count === 1 ? "file" : "files"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <MediaEditDialog
        open={editOpen}
        media={editTarget}
        onClose={() => setEditOpen(false)}
        onSaved={fetchPage}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete media"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.original_name}"? This removes the file from storage and cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
