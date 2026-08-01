export interface HubHeroContent {
  badge: string;
  title: string;
  intro: string;
}

export interface HubStatsContent {
  resources: string;
  free: string;
  paid: string;
  downloads: string;
}

export interface HubFiltersContent {
  allCategories: string;
  collections: string;
  searchPlaceholder: string;
  allTypes: string;
  allPrices: string;
  free: string;
  paid: string;
  featured: string;
  newest: string;
  mostDownloaded: string;
  categoryPrefix: string;
  clear: string;
  search: string;
}

export interface HubEmptyContent {
  title: string;
  filtered: string;
  comingSoon: string;
}

export interface HubDetailContent {
  back: string;
  featured: string;
  premium: string;
  versionHistory: string;
  price: string;
  free: string;
  paid: string;
  perMonth: string;
  pricingFree: string;
  pricingSubscription: string;
  pricingOneTime: string;
  getAccess: string;
  freeDownload: string;
  files: string;
  noFiles: string;
  unlock: string;
  details: string;
  ctaTitle: string;
  ctaButton: string;
}

export interface HubPageContent {
  hero: HubHeroContent;
  stats: HubStatsContent;
  filters: HubFiltersContent;
  empty: HubEmptyContent;
  resultsLine: string;
  ctaTitle: string;
  ctaButton: string;
  detail: HubDetailContent;
}

export const DEFAULT_HUB_CONTENT: HubPageContent = {
  hero: {
    badge: "Automation Hub",
    title: "Browse tools, agents & templates",
    intro:
      "Tested in real client work. Free to copy, adapt and ship — or grab the premium versions that save you hours.",
  },
  stats: {
    resources: "resources",
    free: "free",
    paid: "paid",
    downloads: "downloads",
  },
  filters: {
    allCategories: "All categories",
    collections: "Collections",
    searchPlaceholder: "Search templates, agents, prompts…",
    allTypes: "All types",
    allPrices: "All prices",
    free: "Free",
    paid: "Paid",
    featured: "Featured",
    newest: "Newest",
    mostDownloaded: "Most downloaded",
    categoryPrefix: "Category:",
    clear: "Clear filters",
    search: "Search",
  },
  empty: {
    title: "No resources found",
    filtered: "Try different filters or search terms.",
    comingSoon: "Resources are on the way — check back soon.",
  },
  resultsLine: "{count} of {total} resources",
  ctaTitle: "Want a custom automation built around your exact workflow?",
  ctaButton: "Book a Free 15-Min Audit",
  detail: {
    back: "Back to Hub",
    featured: "Featured",
    premium: "Premium",
    versionHistory: "Version history",
    price: "Price",
    free: "Free",
    paid: "Paid",
    perMonth: "/mo",
    pricingFree: "Download free, forever.",
    pricingSubscription: "Subscription · cancel anytime",
    pricingOneTime: "One-time purchase",
    getAccess: "Get access",
    freeDownload: "Free download",
    files: "Files",
    noFiles: "No downloadable files for this resource yet.",
    unlock: "Unlock this file when purchased.",
    details: "Details",
    ctaTitle: "Need this built for your business?",
    ctaButton: "Book a free audit →",
  },
};
