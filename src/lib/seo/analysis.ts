export type AnalysisLevel = "good" | "warning" | "error" | "info";

export interface AnalysisItem {
  level: AnalysisLevel;
  message: string;
}

export interface SeoAnalysis {
  title: AnalysisItem;
  description: AnalysisItem;
  ogImage: AnalysisItem;
  keywords: AnalysisItem;
  overall: AnalysisLevel;
}

const TITLE_OPTIMAL_MIN = 30;
const TITLE_OPTIMAL_MAX = 60;
const TITLE_HARD_MAX = 70;
const DESC_OPTIMAL_MIN = 120;
const DESC_OPTIMAL_MAX = 155;
const DESC_HARD_MAX = 160;

function analyzeTitle(title: string): AnalysisItem {
  const len = title.length;
  if (len === 0) {
    return { level: "warning", message: "No SEO title set — will default to the page title." };
  }
  if (len > TITLE_HARD_MAX) {
    return {
      level: "error",
      message: `Too long (${len}/${TITLE_HARD_MAX} chars). Search engines will truncate it.`,
    };
  }
  if (len > TITLE_OPTIMAL_MAX) {
    return {
      level: "warning",
      message: `Slightly long (${len} chars). Consider shortening to ${TITLE_OPTIMAL_MAX} or fewer for full display.`,
    };
  }
  if (len < TITLE_OPTIMAL_MIN) {
    return {
      level: "warning",
      message: `Short (${len} chars). Consider ${TITLE_OPTIMAL_MIN}+ characters for better search visibility.`,
    };
  }
  return { level: "good", message: `Good length (${len} chars).` };
}

function analyzeDescription(description: string): AnalysisItem {
  const len = description.length;
  if (len === 0) {
    return {
      level: "warning",
      message: "No meta description set — search engines will auto-generate one.",
    };
  }
  if (len > DESC_HARD_MAX) {
    return {
      level: "error",
      message: `Too long (${len}/${DESC_HARD_MAX} chars). Will be truncated in search results.`,
    };
  }
  if (len > DESC_OPTIMAL_MAX) {
    return {
      level: "warning",
      message: `Slightly long (${len} chars). Consider ${DESC_OPTIMAL_MAX} or fewer for full display.`,
    };
  }
  if (len < DESC_OPTIMAL_MIN) {
    return {
      level: "warning",
      message: `Short (${len} chars). Consider ${DESC_OPTIMAL_MIN}+ characters for a richer snippet.`,
    };
  }
  return { level: "good", message: `Good length (${len} chars).` };
}

function analyzeOgImage(ogImage: string): AnalysisItem {
  if (!ogImage) {
    return { level: "info", message: "No OpenGraph image set. Social shares will use a default." };
  }
  return { level: "good", message: "OpenGraph image is set." };
}

function analyzeKeywords(keywords: string[]): AnalysisItem {
  if (keywords.length === 0) {
    return {
      level: "info",
      message: "No keywords set. Keywords help with internal categorization.",
    };
  }
  if (keywords.length > 10) {
    return {
      level: "warning",
      message: `${keywords.length} keywords — consider keeping the most relevant 5–10.`,
    };
  }
  return {
    level: "good",
    message: `${keywords.length} keyword${keywords.length === 1 ? "" : "s"} set.`,
  };
}

export function analyzeSeo(fields: {
  title: string;
  description: string;
  ogImage: string;
  keywords: string[];
}): SeoAnalysis {
  const title = analyzeTitle(fields.title);
  const description = analyzeDescription(fields.description);
  const ogImage = analyzeOgImage(fields.ogImage);
  const keywords = analyzeKeywords(fields.keywords);

  const levels: AnalysisLevel[] = [title.level, description.level, ogImage.level, keywords.level];
  let overall: AnalysisLevel = "good";
  if (levels.includes("error")) overall = "error";
  else if (levels.includes("warning")) overall = "warning";
  else if (levels.includes("info")) overall = "info";

  return { title, description, ogImage, keywords, overall };
}
