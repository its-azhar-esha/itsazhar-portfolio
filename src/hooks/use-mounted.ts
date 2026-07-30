"use client"

import { useSyncExternalStore } from "react"

function noopSubscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function useMounted() {
  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot)
}
