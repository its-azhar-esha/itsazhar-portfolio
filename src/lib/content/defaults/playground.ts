export interface PlaygroundHeroContent {
  badge: string;
  title: string;
  intro: string;
  openBuilder: string;
  blankCanvas: string;
}

export interface PlaygroundSectionsContent {
  featured: string;
  all: string;
}

export interface PlaygroundDifficultyContent {
  any: string;
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface PlaygroundEmptyContent {
  title: string;
  filtered: string;
  comingSoon: string;
}

export interface PlaygroundTemplateDetailContent {
  back: string;
  views: string;
  stats: string;
  use: string;
  blank: string;
  howItWorks: string;
  whatsInside: string;
  empty: string;
  ctaTitle: string;
  ctaButton: string;
}

export interface PlaygroundShareContent {
  back: string;
  empty: string;
  openBuilder: string;
}

export interface PlaygroundPageContent {
  hero: PlaygroundHeroContent;
  filters: {
    allCategories: string;
    searchPlaceholder: string;
    search: string;
  };
  sections: PlaygroundSectionsContent;
  difficulty: PlaygroundDifficultyContent;
  empty: PlaygroundEmptyContent;
  ctaTitle: string;
  ctaButton: string;
  builder: {
    title: string;
    subtitle: string;
  };
  template: PlaygroundTemplateDetailContent;
  share: PlaygroundShareContent;
}

export const DEFAULT_PLAYGROUND_CONTENT: PlaygroundPageContent = {
  hero: {
    badge: "Workflow Playground",
    title: "Build automation flows, visually",
    intro:
      "Drag and drop triggers, AI steps and actions. Start from a ready-made template or build from scratch — no code required.",
    openBuilder: "Open the builder",
    blankCanvas: "Start from a blank canvas",
  },
  filters: {
    allCategories: "All categories",
    searchPlaceholder: "Search templates...",
    search: "Search",
  },
  sections: {
    featured: "Featured templates",
    all: "Templates",
  },
  difficulty: {
    any: "Any difficulty",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  },
  empty: {
    title: "No templates found",
    filtered: "Try different filters or search terms.",
    comingSoon: "Templates are on the way — check back soon.",
  },
  ctaTitle: "Built a workflow you like? Save it and share it with a link — anyone can remix it.",
  ctaButton: "Open the builder",
  builder: {
    title: "Workflow Builder",
    subtitle: "Drag, drop and connect nodes to build automation flows in your browser.",
  },
  template: {
    back: "← Back to templates",
    views: "views",
    stats: "nodes · connections",
    use: "Use this template",
    blank: "Open blank builder",
    howItWorks: "How it works",
    whatsInside: "What's inside",
    empty: "This template is empty.",
    ctaTitle: "Prefer to build it yourself or need a custom automation?",
    ctaButton: "Talk to me about your workflow",
  },
  share: {
    back: "Back to the playground",
    empty: "This shared workflow could not be loaded.",
    openBuilder: "Open the builder",
  },
};
