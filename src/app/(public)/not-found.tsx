import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card flex h-16 w-16 items-center justify-center rounded-2xl border">
        <span className="text-muted-foreground text-2xl font-bold">404</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Page not found</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
        >
          Go home
        </Link>
        <Link
          href="/contact"
          className="border-border bg-card text-foreground hover:bg-accent inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-all"
        >
          Contact me
        </Link>
      </div>
    </div>
  );
}
