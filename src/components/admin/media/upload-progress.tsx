"use client";

import * as React from "react";

interface UploadProgressProps {
  uploading: boolean;
  progress: number;
}

export function UploadProgress({ uploading, progress }: UploadProgressProps) {
  if (!uploading) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Uploading...</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
