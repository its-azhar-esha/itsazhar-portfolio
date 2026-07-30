"use client";

import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="border-border/40 bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-4 border-b px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenuClick}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground -ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="flex-1 text-lg font-semibold tracking-tight">{title}</h1>
      <form action={signOut}>
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </form>
    </header>
  );
}
