import fs from "fs"
import path from "path"

const KNOWLEDGE_DIR = path.join(process.cwd(), "content", "ai")

interface KnowledgeEntry {
  id: string
  section: string
  content: string
  keywords: string[]
  source: string
}

const JSON_FILES: Record<string, string> = {
  services: "services.json",
  projects: "projects.json",
  about: "about.json",
  contact: "contact.json",
  faq: "faq.json",
}

const INTENT_PATTERNS: [RegExp, string][] = [
  [/service|offer|do you (provide|build)|what (can|do) you/i, "services"],
  [/project|fleet|lease|case.study|showcase|demo|portfolio/i, "projects"],
  [/case.stud/i, "case-studies"],
  [/contact|email|reach|call|message|linkedin|fiverr|get in touch|find you|connect/i, "contact"],
  [/price|cost|pricing|budget|how much|afford|rate|charge|invest|spend/i, "pricing"],
  [/about|who are|tell me about (yourself|azhar)|background|story|philosophy/i, "about"],
  [/tool|tech|stack|technology|platform|n8n|supabase|database|integration/i, "stack"],
  [/faq|question|common|frequent|help|answer/i, "faq"],
  [/industr|sector|field|domain|healthcare|finance|logistics|real.estate|e.commerce/i, "industries"],
  [/audit|consult|discovery|free/i, "audit"],
]

const STOP_WORDS = new Set([
  "what", "is", "the", "do", "you", "your", "how", "can", "i", "me", "a",
  "an", "to", "for", "of", "in", "on", "at", "with", "and", "or", "does",
  "are", "have", "has", "would", "could", "should", "will", "shall", "may",
  "might", "must", "need", "like", "want", "show", "tell", "about", "my",
  "it", "its", "that", "this", "these", "those", "am", "is", "be", "been",
  "being", "was", "were", "do", "did", "doing", "up", "out", "off", "over",
  "not", "no", "nor", "so", "if", "then", "than", "too", "very", "just",
  "some", "any", "all", "each", "every", "both", "few", "more", "most",
  "other", "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "once", "here", "there", "when",
  "where", "why", "which", "who", "whom",
])

let cachedEntries: KnowledgeEntry[] | null = null

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8").trim()
  } catch {
    return null
  }
}

function readJSONFile<T>(filename: string): T | null {
  const filePath = path.join(KNOWLEDGE_DIR, filename)
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

function jsonToText(filename: string): string {
  const data = readJSONFile<unknown>(filename)
  if (!data) return ""
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) =>
      Object.entries(item)
        .map(([key, value]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1)
          if (Array.isArray(value)) return `${label}: ${value.join(", ")}`
          return `${label}: ${value}`
        })
        .join("\n")
    ).join("\n\n")
  }
  if (typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1)
        if (Array.isArray(value)) return `${label}: ${value.join(", ")}`
        if (typeof value === "object") {
          return Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        }
        return `${label}: ${value}`
      })
      .join("\n")
  }
  return ""
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function buildKnowledgeEntries(): KnowledgeEntry[] {
  if (cachedEntries) return cachedEntries

  const entries: KnowledgeEntry[] = []

  for (const [key, filename] of Object.entries(JSON_FILES)) {
    const data = readJSONFile<unknown>(filename)
    if (!data) continue
    if (Array.isArray(data)) {
      for (const item of data as Record<string, unknown>[]) {
        const content = Object.entries(item)
          .map(([k, v]) => {
            if (Array.isArray(v)) return `${k}: ${v.join(", ")}`
            return `${k}: ${v}`
          })
          .join("\n")
        const title = (item.name || item.title || item.question || key) as string
        const textContent = title + " " + Object.values(item).filter(v => typeof v === "string").join(" ")
        entries.push({
          id: `${key}-${entries.length}`,
          section: String(title),
          content,
          keywords: extractKeywords(textContent),
          source: key,
        })
      }
    }
  }

  const mdFiles = ["about.md", "services.md", "projects.md", "case-studies.md", "faq.md", "contact.md", "stack.md", "pricing.md"]
  for (const file of mdFiles) {
    const filePath = path.join(KNOWLEDGE_DIR, file)
    const content = readFile(filePath)
    if (!content) continue
    const source = file.replace(".md", "")
    entries.push({
      id: `md-${source}`,
      section: source,
      content,
      keywords: extractKeywords(content),
      source,
    })
  }

  cachedEntries = entries
  return entries
}

function scoreEntry(query: string, entry: KnowledgeEntry): number {
  const queryKeywords = extractKeywords(query)
  if (queryKeywords.length === 0) return 0

  let score = 0
  const queryLower = query.toLowerCase()

  for (const qk of queryKeywords) {
    for (const ek of entry.keywords) {
      if (ek === qk) score += 15
      else if (ek.includes(qk) || qk.includes(ek)) score += 8
      else if (ek.startsWith(qk) || qk.startsWith(ek)) score += 5
    }
  }

  const sectionLower = entry.section.toLowerCase()
  if (sectionLower.includes(queryLower)) score += 40
  if (queryLower.includes(sectionLower)) score += 20

  const contentLower = entry.content.toLowerCase()
  if (contentLower.includes(queryLower)) score += 10

  for (const qk of queryKeywords) {
    if (contentLower.includes(qk)) score += 3
  }

  return score
}

function getFilesForIntent(intent: string): string[] {
  const intentFiles: Record<string, string[]> = {
    services: ["services.json", "services.md"],
    projects: ["projects.json", "projects.md"],
    "case-studies": ["case-studies.md"],
    contact: ["contact.json", "contact.md"],
    pricing: ["pricing.md"],
    about: ["about.json", "about.md"],
    stack: ["stack.md"],
    faq: ["faq.json", "faq.md"],
    industries: ["services.json", "projects.json"],
    audit: ["faq.json", "contact.json", "services.json"],
    general: ["about.json", "services.json", "faq.json", "about.md", "services.md", "faq.md", "projects.json"],
  }
  return intentFiles[intent] || intentFiles.general
}

export function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(lower)) return intent
  }
  return "general"
}

export function loadKnowledge(): string {
  const entries = buildKnowledgeEntries()
  return entries.map(e => `[${e.section}]\n${e.content}`).join("\n\n---\n\n")
}

export function getRelevantKnowledge(message: string): string {
  const intent = detectIntent(message)
  const files = getFilesForIntent(intent)

  let combined = ""
  for (const file of files) {
    if (file.endsWith(".json")) {
      combined += jsonToText(file) + "\n\n"
    } else {
      const filePath = path.join(KNOWLEDGE_DIR, file)
      const content = readFile(filePath)
      if (content) combined += content.trim() + "\n\n"
    }
  }

  return combined.trim()
}

export function findRelevantKnowledge(message: string): string {
  const intent = detectIntent(message)
  const files = getFilesForIntent(intent)
  const intentData: string[] = []

  for (const file of files) {
    if (file.endsWith(".json")) {
      const text = jsonToText(file)
      if (text) intentData.push(text)
    } else {
      const filePath = path.join(KNOWLEDGE_DIR, file)
      const content = readFile(filePath)
      if (content) intentData.push(content)
    }
  }

  if (intentData.length > 0) {
    const combined = intentData.join("\n\n")
    const entries = buildKnowledgeEntries().filter(e =>
      files.some(f => f.startsWith(e.source) || e.source.startsWith(f.replace(".md", "").replace(".json", "")))
    )
    const scored = entries.map(e => ({ entry: e, score: scoreEntry(message, e) }))
    scored.sort((a, b) => b.score - a.score)

    const bestScore = scored[0]?.score || 0
    if (bestScore >= 5) {
      const topEntries = scored.filter(s => s.score >= bestScore * 0.5).slice(0, 3)
      return topEntries.map(s => s.entry.content).join("\n\n---\n\n")
    }

    return combined
  }

  return loadFallbackFAQ()
}

/* 
 * FUTURE: Auto-generate AI knowledge from content layer
 * import { projects } from "@/content/projects"
 * import { services } from "@/content/services" 
 * import { faqItems } from "@/content/faq"
 * This will replace the file-system based knowledge loading
 * when transitioning to a CMS-driven architecture.
 */

export function loadFallbackFAQ(): string {
  const faqJson = readJSONFile<{ question: string; answer: string }[]>("faq.json")
  if (faqJson && Array.isArray(faqJson)) {
    return faqJson
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join("\n\n")
  }
  return "FAQ content is temporarily unavailable. Please contact me through the contact form."
}
