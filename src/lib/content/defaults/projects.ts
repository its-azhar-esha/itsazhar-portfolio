export interface ProjectsHeroContent {
  badge: string;
  title: string;
  intro: string;
}

export interface ProjectsStatusLabelsContent {
  production: string;
  development: string;
  prototype: string;
  completed: string;
}

export interface ProjectsIndustryEmptyContent {
  comingSoon: string;
  description: string;
  hint: string;
  discussText: string;
  discussLabel: string;
  returnAll: string;
}

export interface ProjectsSearchEmptyContent {
  title: string;
  description: string;
  clearAll: string;
}

export interface ProjectsCardLabelsContent {
  demo: string;
  details: string;
}

export interface ProjectsDetailContent {
  back: string;
  gallery: string;
  challenge: string;
  solution: string;
  workflow: string;
  keyFeatures: string;
  futureScope: string;
  stack: string;
  impact: string;
  watchDemo: string;
  viewFullDetails: string;
  related: string;
  previous: string;
  next: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
}

export interface ProjectsPageContent {
  hero: ProjectsHeroContent;
  filters: {
    all: string;
  };
  searchPlaceholder: string;
  statuses: ProjectsStatusLabelsContent;
  industryEmpty: ProjectsIndustryEmptyContent;
  searchEmpty: ProjectsSearchEmptyContent;
  cards: ProjectsCardLabelsContent;
  detail: ProjectsDetailContent;
}

export const DEFAULT_PROJECTS_CONTENT: ProjectsPageContent = {
  hero: {
    badge: "Real Projects Built with AI + Automation",
    title: "Featured Systems & Automation Projects",
    intro:
      "Explore production-ready AI systems, workflow automations, and business solutions designed to eliminate repetitive work and improve operational efficiency.",
  },
  filters: {
    all: "All",
  },
  searchPlaceholder: "Search projects...",
  statuses: {
    production: "Production Ready",
    development: "In Development",
    prototype: "Prototype",
    completed: "Completed",
  },
  industryEmpty: {
    comingSoon: "Coming Soon",
    description: "No projects available for {industry} yet.",
    hint: "I am actively building automation systems for this sector.",
    discussText: "Want something custom? Let's discuss your workflow.",
    discussLabel: "Let's Discuss",
    returnAll: "Return to All",
  },
  searchEmpty: {
    title: "No matching projects found",
    description: "Try another keyword or filter.",
    clearAll: "Clear all filters",
  },
  cards: {
    demo: "Demo",
    details: "View Details",
  },
  detail: {
    back: "← All Projects",
    gallery: "Gallery",
    challenge: "The Challenge",
    solution: "The Solution",
    workflow: "Workflow",
    keyFeatures: "Key Features",
    futureScope: "Future Scope",
    stack: "Technology Stack",
    impact: "Impact & Outcome",
    watchDemo: "Watch Full Demo",
    viewFullDetails: "View Full Details",
    related: "Related Projects",
    previous: "Previous",
    next: "Next",
    ctaTitle: "Interested in a similar system for your business?",
    ctaDescription:
      "Book a free 15-minute automation audit to explore what's possible for your workflow.",
    ctaButton: "Book a Free 15-Min Audit",
  },
};
