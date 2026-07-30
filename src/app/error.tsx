"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-card">
        <span className="text-2xl font-bold text-destructive">!</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Please try again or contact me if the problem persists.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
