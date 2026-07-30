import type { LucideIcon } from "lucide-react"

export interface TimelineEvent {
  year: string
  title: string
  description: string
}

export interface Value {
  icon: LucideIcon
  title: string
  description: string
}

export interface BuildStep {
  icon: LucideIcon
  title: string
  description: string
}

export interface Tool {
  name: string
  icon?: string
  category?: string
}
