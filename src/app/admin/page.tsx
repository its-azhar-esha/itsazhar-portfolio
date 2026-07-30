import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome to the admin panel.</p>
        </div>
        <form action={signOut}>
          <Button variant="outline" type="submit" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
