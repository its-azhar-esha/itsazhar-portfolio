"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchMediaAction } from "@/lib/media/actions";
import type { MediaFile, MediaKind } from "@/types/media";
import { formatBytes, formatDimensions } from "@/lib/media/utils";
import { MediaCard } from "./media-card";
import { MediaImage } from "./media-image";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  /** Restricts the picker to one media kind (e.g. "video" for intro videos). */
  typeFilter?: MediaKind;
}

const KIND_TABS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
] as const;

type KindTab = (typeof KIND_TABS)[number]["value"];

export function MediaPicker({ open, onClose, onSelect, typeFilter }: MediaPickerProps) {
  function handleSelect(media: MediaFile) {
    onSelect(media);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <PickerDialog
          key="picker"
          onClose={onClose}
          onSelect={handleSelect}
          typeFilter={typeFilter}
        />
      )}
    </AnimatePresence>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function PickerDialog({
  onClose,
  onSelect,
  typeFilter,
}: {
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  typeFilter?: MediaKind;
}) {
  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState<KindTab>(() =>
    typeFilter === "image" || typeFilter === "video" || typeFilter === "document"
      ? typeFilter
      : "all",
  );
  const [items, setItems] = React.useState<MediaFile[]>([]);
  const [selected, setSelected] = React.useState<MediaFile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    searchRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const result = await searchMediaAction(
        debouncedSearch,
        24,
        kind === "all" ? undefined : kind,
      );
      if (!active) return;
      if (result.success) {
        setItems(result.data);
      } else {
        setError(result.error);
      }
      setSelected(null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [debouncedSearch, kind]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
        aria-label="Media library"
        className="border-border/50 bg-background relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border shadow-xl"
      >
        <div className="border-border/40 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-muted-foreground h-4 w-4" />
            <h3 className="text-sm font-semibold">Media Library</h3>
          </div>
          <div className="relative max-w-xs flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={searchRef}
              placeholder="Search media..."
              aria-label="Search media"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!typeFilter && (
          <div
            role="tablist"
            aria-label="Filter by media type"
            className="border-border/40 flex items-center gap-1 border-b px-5 py-2"
          >
            {KIND_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={kind === tab.value}
                onClick={() => {
                  setKind(tab.value);
                  setLoading(true);
                  setError(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  kind === tab.value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted aspect-video animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setSearch("");
                }}
              >
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-muted-foreground text-sm">
                {search ? "No media matches your search." : "No media uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  selected={selected?.id === media.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-border/40 flex items-center gap-4 border-t px-5 py-4">
          {selected ? (
            <>
              <MediaImage media={selected} className="h-16 w-24 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={selected.original_name}>
                  {selected.original_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selected.mime_type} · {formatBytes(selected.size_bytes)}
                  {selected.width && selected.height
                    ? ` · ${formatDimensions(selected.width, selected.height)}`
                    : ""}
                </p>
              </div>
              <Button size="sm" onClick={() => onSelect(selected)}>
                Use this media
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground flex-1 text-center text-xs">
              Select an item to preview and use it.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
