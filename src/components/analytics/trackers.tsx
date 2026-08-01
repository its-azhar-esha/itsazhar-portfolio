"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEventAction } from "@/lib/analytics/actions";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem("tracking_session");
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random()}`;
    window.sessionStorage.setItem("tracking_session", id);
  }
  return id;
}

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void trackEventAction("page_view", {
      pagePath: pathname,
      sessionId: getSessionId(),
    });
  }, [pathname]);

  return null;
}

export function CtaClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const tracked = target?.closest?.("[data-track]") as HTMLElement | null;
      if (!tracked) return;
      const eventName = tracked.getAttribute("data-track") || "cta_click";
      const label = tracked.getAttribute("data-track-label") || "";
      void trackEventAction(eventName, {
        pagePath: pathname,
        label,
        sessionId: getSessionId(),
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}

export function HubSearchTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("search")?.trim();
    if (!query) return;
    void trackEventAction("hub_search", {
      pagePath: pathname,
      label: query.slice(0, 200),
      sessionId: getSessionId(),
    });
  }, [pathname, searchParams]);

  return null;
}
