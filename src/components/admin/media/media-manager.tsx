"use client";

import * as React from "react";
import {
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderOpen,
  ImageOff,
  LayoutGrid,
  List,
  Pencil,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bulkDeleteMediaAction,
  bulkUpdateMediaAction,
  getMediaFoldersAction,
  getMediaPageAction,
  getMediaTagsAction,
  getUnusedMediaAction,
} from "@/lib/media/actions";
import { MEDIA_DEFAULT_PAGE_SIZE, MEDIA_SORT_OPTIONS } from "@/constants/media";
import { formatBytes, formatDimensions } from "@/lib/media/utils";
import type { MediaFile, MediaFolder, MediaSort } from "@/types/media";
import { MediaCard } from "@/components/media/media-card";
import { MediaThumbnail } from "@/components/media/media-thumbnail";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaDetailDialog } from "./media-detail-dialog";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

interface MediaManagerProps {
  initialError?: string | null;
}

interface UnusedResult {
  items: MediaFile[];
  total: number;
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
  const [detailTarget, setDetailTarget] = React.useState<MediaFile | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState("");

  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  const [tagList, setTagList] = React.useState<{ tag: string; count: number }[]>([]);
  const [folderFilter, setFolderFilter] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");

  const [bulkMode, setBulkMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [bulkFolder, setBulkFolder] = React.useState("");
  const [bulkTags, setBulkTags] = React.useState("");
  const [deleteArmed, setDeleteArmed] = React.useState(false);

  const [unused, setUnused] = React.useState<UnusedResult | null>(null);
  const [unusedLoading, setUnusedLoading] = React.useState(false);
  const [unusedError, setUnusedError] = React.useState<string | null>(null);
  const [unusedOpen, setUnusedOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [foldersResult, tagsResult] = await Promise.all([
        getMediaFoldersAction(),
        getMediaTagsAction(),
      ]);
      if (foldersResult.success) setFolders(foldersResult.data);
      if (tagsResult.success) setTagList(tagsResult.data);
    })();
  }, []);

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
      folder: folderFilter || undefined,
      tag: tagFilter || undefined,
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
        folder: folderFilter || undefined,
        tag: tagFilter || undefined,
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
  }, [search, sort, page, folderFilter, tagFilter]);

  function refreshMeta() {
    getMediaFoldersAction().then((result) => {
      if (result.success) setFolders(result.data);
    });
    getMediaTagsAction().then((result) => {
      if (result.success) setTagList(result.data);
    });
  }

  function openDetail(media: MediaFile) {
    setDetailTarget(media);
    setDetailOpen(true);
  }

  function handleCardClick(media: MediaFile) {
    if (bulkMode) {
      toggleSelected(media.id);
      return;
    }
    openDetail(media);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
    refreshMeta();
    fetchPage();
  }

  async function handleBulkUpdate() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    const input: Record<string, unknown> = { ids };
    const folder = bulkFolder.trim();
    if (folder !== "") input.folder = folder;
    const tags = bulkTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length > 0) input.tags = tags;
    const result = await bulkUpdateMediaAction(input);
    setBulkBusy(false);
    if (result.success) {
      setBulkFolder("");
      setBulkTags("");
      setSelected(new Set());
      refreshMeta();
      fetchPage();
    } else {
      setBulkError(result.error);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    const result = await bulkDeleteMediaAction({ ids });
    setBulkBusy(false);
    if (result.success) {
      setDeleteArmed(false);
      setSelected(new Set());
      refreshMeta();
      if (unusedOpen) scanUnused();
      fetchPage();
    } else {
      setBulkError(result.error);
    }
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelected(new Set());
    setDeleteArmed(false);
    setBulkError(null);
  }

  async function scanUnused() {
    setUnusedLoading(true);
    setUnusedError(null);
    const result = await getUnusedMediaAction();
    setUnusedLoading(false);
    if (result.success) {
      setUnused(result.data);
    } else {
      setUnusedError(result.error);
    }
  }

  async function deleteUnused(ids: string[]) {
    if (ids.length === 0) return;
    setUnusedLoading(true);
    const result = await bulkDeleteMediaAction({ ids });
    setUnusedLoading(false);
    if (result.success) {
      refreshMeta();
      scanUnused();
      fetchPage();
    } else {
      setUnusedError(result.error);
    }
  }

  const allPageSelected = items.length > 0 && items.every((m) => selected.has(m.id));

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
      {!bulkMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDetail(media);
          }}
          className="bg-background/90 text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-colors"
          title="View details and edit metadata"
          aria-label={`View details for ${media.original_name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={folderFilter}
            onChange={(e) => {
              setFolderFilter(e.target.value);
              setPage(1);
            }}
            className="border-border/40 bg-background hover:bg-accent/50 h-9 rounded-md border px-3 text-sm transition-colors outline-none"
            aria-label="Filter by folder"
            title="Filter by folder"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f.folder} value={f.folder}>
                {f.folder} ({f.count})
              </option>
            ))}
          </select>

          {tagList.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setPage(1);
              }}
              className="border-border/40 bg-background hover:bg-accent/50 h-9 rounded-md border px-3 text-sm transition-colors outline-none"
              aria-label="Filter by tag"
              title="Filter by tag"
            >
              <option value="">All tags</option>
              {tagList.map((t) => (
                <option key={t.tag} value={t.tag}>
                  {t.tag} ({t.count})
                </option>
              ))}
            </select>
          )}

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

          {bulkMode ? (
            <Button size="sm" variant="outline" onClick={exitBulkMode}>
              Done
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setBulkMode(true)}>
              <CheckSquare className="mr-1.5 h-4 w-4" />
              Select
            </Button>
          )}

          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="mr-1.5 h-4 w-4" />
            {showUpload ? "Done" : "Upload"}
          </Button>
        </div>
      </div>

      {bulkMode && (
        <div className="border-border/40 bg-accent/30 rounded-lg border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium">
              {selected.size} selected
              {items.length > 0 && " on this page"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSelected(allPageSelected ? new Set() : new Set(items.map((m) => m.id)))
              }
            >
              {allPageSelected ? "Clear page" : "Select page"}
            </Button>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Input
                value={bulkFolder}
                onChange={(e) => setBulkFolder(e.target.value)}
                placeholder="Move to folder…"
                className="h-8 w-40"
                aria-label="Folder to move selected files to"
              />
              <Input
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                placeholder="Set tags (comma separated)…"
                className="h-8 w-56"
                aria-label="Tags to apply to selected files"
              />
              <Button
                size="sm"
                onClick={handleBulkUpdate}
                disabled={bulkBusy || selected.size === 0 || (bulkFolder.trim() === "" && bulkTags.trim() === "")}
              >
                {bulkBusy ? "Applying…" : "Apply"}
              </Button>
            </div>
            {deleteArmed ? (
              <>
                <span className="text-xs text-red-500">Delete {selected.size} file(s)?</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={bulkBusy || selected.size === 0}
                  className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {bulkBusy ? "Deleting…" : "Yes, delete"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteArmed(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteArmed(true)}
                disabled={selected.size === 0}
                className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
          {bulkError && <p className="mt-2 text-xs text-red-500">{bulkError}</p>}
        </div>
      )}

      {showUpload && (
        <MediaUploader
          multiple
          folder={folderFilter || undefined}
          onUploaded={handleUploaded}
          onError={() => undefined}
        />
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
            {search || folderFilter || tagFilter
              ? "No media matches the current filters."
              : "No media uploaded yet."}
          </p>
          {!search && !folderFilter && !tagFilter && (
            <Button size="sm" className="mt-4" onClick={() => setShowUpload(true)}>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload your first image
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              onSelect={() => handleCardClick(media)}
              selected={bulkMode && selected.has(media.id)}
              actions={cardActions(media)}
            />
          ))}
        </div>
      ) : (
        <div className="border-border/40 overflow-hidden rounded-lg border">
          {items.map((media) => (
            <div
              key={media.id}
              onClick={() => handleCardClick(media)}
              className={cn(
                "border-border/40 hover:bg-accent/40 flex cursor-pointer items-center gap-3 border-b p-3 transition-colors last:border-b-0",
                bulkMode && selected.has(media.id) && "bg-accent/60",
              )}
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
                  {media.folder !== "media" && (
                    <span className="text-primary ml-1 inline-flex items-center gap-0.5">
                      <FolderOpen className="h-3 w-3" />
                      {media.folder}
                    </span>
                  )}
                </p>
                {media.tags.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {media.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]"
                      >
                        <Tags className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {cardActions(media)}
              </div>
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

      <div className="border-border/40 rounded-lg border">
        <button
          onClick={() => {
            const next = !unusedOpen;
            setUnusedOpen(next);
            if (next && !unused && !unusedLoading) scanUnused();
          }}
          className="hover:bg-accent/40 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
          aria-expanded={unusedOpen}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Trash2 className="text-muted-foreground h-4 w-4" />
            Unused media
            {unused && !unusedLoading && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  unused.items.length > 0
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500",
                )}
              >
                {unused.items.length} of {unused.total}
              </span>
            )}
          </span>
          <ChevronRight
            className={cn("text-muted-foreground h-4 w-4 transition-transform", unusedOpen && "rotate-90")}
          />
        </button>
        {unusedOpen && (
          <div className="border-border/40 border-t px-4 py-3">
            <p className="text-muted-foreground mb-3 text-xs">
              Files that are not referenced by any project, page, post or template. Deleting them
              frees storage space.
            </p>
            {unusedLoading ? (
              <p className="text-muted-foreground text-xs">Scanning the CMS…</p>
            ) : unusedError ? (
              <p className="text-xs text-red-500">{unusedError}</p>
            ) : unused && unused.items.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                All {unused.total} files are in use. Nothing to clean up.
              </p>
            ) : unused ? (
              <div className="space-y-3">
                <ul className="divide-border/40 divide-y">
                  {unused.items.map((media) => (
                    <li key={media.id} className="flex items-center gap-3 py-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <MediaThumbnail media={media} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium" title={media.original_name}>
                            {media.original_name}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {formatBytes(media.size_bytes)} ·{" "}
                            {new Date(media.created_at).toLocaleDateString()}
                            {media.folder !== "media" && ` · ${media.folder}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteUnused([media.id])}
                        className="gap-1 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteUnused(unused.items.map((m) => m.id))}
                  className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete all {unused.items.length} unused
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={scanUnused}>
                Scan for unused files
              </Button>
            )}
          </div>
        )}
      </div>

      <MediaDetailDialog
        open={detailOpen}
        media={detailTarget}
        onClose={() => setDetailOpen(false)}
        onChanged={(updated) => {
          setDetailTarget(updated);
          setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          refreshMeta();
        }}
        onDeleted={() => {
          setDetailOpen(false);
          refreshMeta();
          fetchPage();
        }}
      />
    </div>
  );
}
