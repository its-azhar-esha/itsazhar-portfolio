export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="bg-muted h-7 w-48 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card rounded-xl border p-5">
          <div className="bg-muted mb-3 h-4 w-20 rounded" />
          <div className="bg-muted h-8 w-16 rounded" />
        </div>
        <div className="bg-card rounded-xl border p-5">
          <div className="bg-muted mb-3 h-4 w-20 rounded" />
          <div className="bg-muted h-8 w-16 rounded" />
        </div>
        <div className="bg-card rounded-xl border p-5">
          <div className="bg-muted mb-3 h-4 w-20 rounded" />
          <div className="bg-muted h-8 w-16 rounded" />
        </div>
      </div>
      <div className="bg-card rounded-xl border">
        <div className="border-b-border border-b p-4">
          <div className="bg-muted h-5 w-32 rounded" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-muted h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-3/4 rounded" />
                <div className="bg-muted h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
