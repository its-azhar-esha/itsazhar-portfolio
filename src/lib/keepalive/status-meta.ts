import type { KeepAliveStatus } from "@/lib/keepalive/actions";

export const STATUS_META: Record<KeepAliveStatus, { label: string; emoji: string; badge: string }> =
  {
    ok: {
      label: "Healthy",
      emoji: "🟢",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    },
    warn: {
      label: "Warning",
      emoji: "🟡",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    },
    error: {
      label: "Error",
      emoji: "🔴",
      badge: "border-red-500/30 bg-red-500/10 text-red-500",
    },
    info: {
      label: "Info",
      emoji: "ℹ️",
      badge: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    },
  };
