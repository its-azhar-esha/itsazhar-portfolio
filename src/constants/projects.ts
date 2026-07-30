export const PROJECT_INDUSTRIES = [
  "Healthcare",
  "Finance & FinTech",
  "Business Operations",
  "Logistics",
  "E-Commerce",
  "Real Estate",
  "Education",
  "Manufacturing",
  "Human Resources",
  "Sales & CRM",
  "Marketing",
  "Customer Support",
  "Legal",
  "Insurance",
  "Hospitality",
  "Travel",
  "Construction",
  "Non-Profit",
  "Government",
  "Document Intelligence",
  "Custom Solutions",
] as const;

export type ProjectIndustry = (typeof PROJECT_INDUSTRIES)[number];

export const PROJECT_CATEGORIES = [
  "Logistics",
  "Real Estate",
  "Document Intelligence",
  "Document Processing",
  "Customer Support",
  "Business Operations",
  "E-Commerce",
  "Finance & FinTech",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const DB_PROJECT_STATUSES = ["draft", "active", "archived"] as const;

export const PUBLIC_PROJECT_STATUSES = [
  "Production Ready",
  "In Development",
  "Prototype",
  "Completed",
] as const;

export const SORT_OPTIONS = [
  { label: "Newest First", value: "created_at_desc" },
  { label: "Oldest First", value: "created_at_asc" },
  { label: "Title A-Z", value: "title_asc" },
  { label: "Title Z-A", value: "title_desc" },
  { label: "Featured First", value: "featured_desc" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const FEATURED_LABELS = {
  featured: "Featured",
  not_featured: "Not Featured",
} as const;

export const PROJECT_DEFAULTS = {
  PAGE_SIZE: 20,
  DEFAULT_SORT: "created_at_desc" as SortOption,
} as const;
