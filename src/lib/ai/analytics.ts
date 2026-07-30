const STORAGE_KEY = "azhar-ai-analytics"

interface AnalyticsData {
  totalQuestions: number
  intentCounts: Record<string, number>
  suggestionClicks: number
  modelUsage: Record<string, number>
  fallbackCount: number
  sessionStart: number
}

function read(): AnalyticsData {
  if (typeof window === "undefined") return emptyData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : emptyData()
  } catch {
    return emptyData()
  }
}

function write(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function emptyData(): AnalyticsData {
  return {
    totalQuestions: 0,
    intentCounts: {},
    suggestionClicks: 0,
    modelUsage: {},
    fallbackCount: 0,
    sessionStart: Date.now(),
  }
}

export function trackQuestion(intent: string): void {
  const data = read()
  data.totalQuestions++
  data.intentCounts[intent] = (data.intentCounts[intent] || 0) + 1
  write(data)
}

export function trackSuggestionClick(): void {
  const data = read()
  data.suggestionClicks++
  write(data)
}

export function trackModelUsage(model: string): void {
  const data = read()
  data.modelUsage[model] = (data.modelUsage[model] || 0) + 1
  write(data)
}

export function trackFallback(): void {
  const data = read()
  data.fallbackCount++
  write(data)
}

export function getAnalytics(): AnalyticsData {
  return read()
}

export function resetAnalytics(): void {
  write(emptyData())
}
