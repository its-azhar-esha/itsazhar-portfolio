import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are currently offline.",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card flex h-16 w-16 items-center justify-center rounded-2xl border">
        <span className="text-muted-foreground text-2xl font-bold">!</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">You&apos;re offline</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        Please check your internet connection and try again.
      </p>
    </div>
  );
}
