"use client";

import * as React from "react";
import { uploadFileAction } from "@/lib/storage";
import { UploadProgress } from "./upload-progress";
import { UploadZone } from "./upload-zone";

interface MediaUploadProps {
  folder?: string;
  onUploadComplete: (url: string) => void;
}

export function MediaUpload({ folder = "temp", onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFiles(files: File[]) {
    for (const file of files) {
      setUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      setProgress(50);
      const result = await uploadFileAction(formData);
      setProgress(100);

      if (result.error) {
        setError(result.error);
        setUploading(false);
        return;
      }
      onUploadComplete(result.url);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <UploadZone onFilesSelected={handleFiles} disabled={uploading} />
      <UploadProgress uploading={uploading} progress={progress} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
