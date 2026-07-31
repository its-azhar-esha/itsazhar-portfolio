"use client";

import { Link2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url).then(
          () => toast.success("Link copied!"),
          () => toast.error("Could not copy link"),
        );
      }}
      aria-label={label}
      title={label}
      className="border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors"
    >
      <Link2 className="h-4 w-4" />
    </button>
  );
}
