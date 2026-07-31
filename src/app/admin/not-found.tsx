import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card flex h-14 w-14 items-center justify-center rounded-2xl border">
        <span className="text-muted-foreground text-xl font-bold">404</span>
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">Page not found</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The admin page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
