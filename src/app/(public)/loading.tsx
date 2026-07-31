export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary/30 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
