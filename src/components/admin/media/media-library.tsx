"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listFilesAction, deleteFileAction } from "@/lib/storage";
import type { MediaFile } from "@/lib/storage";
import { MediaGrid } from "./media-grid";
import { MediaUpload } from "./media-upload";

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  folder?: string;
}

export function MediaLibrary({ onSelect, folder }: MediaLibraryProps) {
  const [files, setFiles] = React.useState<MediaFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [showUpload, setShowUpload] = React.useState(false);

  React.useEffect(() => {
    listFilesAction(folder).then((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setFiles(result.files);
      }
      setLoading(false);
    });
  }, [folder]);

  const filtered = React.useMemo(
    () =>
      search ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) : files,
    [files, search],
  );

  async function handleDelete(path: string) {
    const result = await deleteFileAction(path);
    if (!result.error) {
      setFiles((prev) => prev.filter((f) => !f.url.includes(path)));
    }
  }

  function handleUploadComplete() {
    setShowUpload(false);
    setLoading(true);
    listFilesAction(folder).then((result) => {
      if (!result.error) setFiles(result.files);
      setLoading(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? "Cancel" : "Upload Files"}
        </Button>
      </div>

      {showUpload && <MediaUpload folder={folder} onUploadComplete={handleUploadComplete} />}

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
              listFilesAction(folder).then((result) => {
                if (result.error) setError(result.error);
                else setFiles(result.files);
                setLoading(false);
              });
            }}
          >
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {search ? "No files match your search." : "No files uploaded yet."}
          </p>
        </div>
      ) : (
        <MediaGrid files={filtered} onSelect={onSelect} onDelete={handleDelete} />
      )}
    </div>
  );
}
