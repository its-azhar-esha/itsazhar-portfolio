"use client";

import { useEffect } from "react";
import { error as logError } from "@/lib/logger";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Admin error boundary caught", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card flex h-14 w-14 items-center justify-center rounded-2xl border">
        <span className="text-destructive text-xl font-bold">!</span>
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">Dashboard error</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The dashboard failed to load. This might be a temporary issue.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
