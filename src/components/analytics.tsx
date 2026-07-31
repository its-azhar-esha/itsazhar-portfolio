"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    clarity: (...args: unknown[]) => void;
  }
}

export function Analytics({ gaId }: { gaId?: string }) {
  const pathname = usePathname();
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    try {
      if (typeof window.gtag === "function" && gaId) {
        window.gtag("config", gaId, { page_path: pathname });
      }
      if (typeof window.clarity === "function") {
        window.clarity("set", "page", pathname);
      }
    } catch {}
  }, [pathname, gaId]);

  return null;
}
