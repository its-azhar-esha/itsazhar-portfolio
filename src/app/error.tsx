"use client";

import { useEffect } from "react";
import Link from "next/link";
import { error as logError } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Global error boundary caught", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card flex h-16 w-16 items-center justify-center rounded-2xl border">
        <span className="text-destructive text-2xl font-bold">!</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        An unexpected error occurred. Please try again or contact me if the problem persists.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border-border bg-card text-foreground hover:bg-accent inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-all"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
