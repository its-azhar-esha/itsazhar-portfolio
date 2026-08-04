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
  "Accounting & Bookkeeping",
  "Advertising",
  "Agriculture",
  "Architecture",
  "Automotive",
  "Aviation",
  "Banking",
  "Biotechnology",
  "Communications",
  "Consulting",
  "Consumer Goods",
  "Cybersecurity",
  "Data Analytics",
  "Energy",
  "Entertainment",
  "Environmental Services",
  "Fashion & Apparel",
  "Fitness & Wellness",
  "Food & Beverage",
  "Gaming",
  "IoT",
  "Media & Publishing",
  "Medical Devices",
  "Oil & Gas",
  "Pharmaceuticals",
  "Professional Services",
  "Public Safety",
  "Renewable Energy",
  "Retail",
  "Robotics",
  "SaaS",
  "Security & Surveillance",
  "Sports",
  "Staffing & Recruitment",
  "Startups",
  "Technology & Software",
  "Telecommunications",
  "Transportation",
  "Utilities",
  "Wholesale",
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
  "Workflow Automation",
  "AI Agents & Chatbots",
  "Data Integration & APIs",
  "Lead Generation",
  "Sales Automation",
  "Marketing Automation",
  "HR & Recruitment Automation",
  "Accounting Automation",
  "Content Generation",
  "Voice & Call Automation",
  "Analytics & Reporting",
  "Data Extraction & OCR",
  "Web Scraping & Data Enrichment",
  "CRM Integration",
  "Inventory & Order Management",
  "Internal Tools & Dashboards",
  "Client Portals",
  "Notification & Alerting",
  "Booking & Scheduling",
  "Email & SMS Automation",
  "Document Generation",
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
