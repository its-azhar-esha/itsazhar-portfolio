"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    clarity: (...args: unknown[]) => void
  }
}

export function Analytics() {
  const pathname = usePathname()
  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true
      return
    }
    try {
      if (typeof window.gtag === "function") {
        window.gtag("config", "G-XXXXXXXXXX", { page_path: pathname })
      }
      if (typeof window.clarity === "function") {
        window.clarity("set", "page", pathname)
      }
    } catch {}
  }, [pathname])

  return null
}
