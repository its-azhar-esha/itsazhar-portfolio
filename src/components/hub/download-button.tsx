"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { getDownloadUrlAction } from "@/lib/hub/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { PublicResourceFile } from "@/types/hub";

interface DownloadButtonProps {
  file: PublicResourceFile;
  label?: string;
}

export function DownloadButton({ file, label }: DownloadButtonProps) {
  const [downloading, setDownloading] = React.useState(false);
  const toast = useToast();

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const result = await getDownloadUrlAction(file.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      window.open(result.data, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Something went wrong while preparing the download.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2">
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label ?? `Download ${file.label}`}
    </Button>
  );
}
