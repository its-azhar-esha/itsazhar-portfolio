export interface BlogEmptyContent {
  title: string;
  description: string;
}

export interface BlogCtaContent {
  title: string;
  button: string;
}

export interface BlogDetailContent {
  back: string;
  minRead: string;
  writtenBy: string;
  authorBio: string;
  getInTouch: string;
  keepReading: string;
  moreSubtitle: string;
  ctaTitle: string;
  ctaButton: string;
}

export interface BlogPageContent {
  empty: BlogEmptyContent;
  allLabel: string;
  moreArticles: string;
  cta: BlogCtaContent;
  detail: BlogDetailContent;
}

export const DEFAULT_BLOG_CONTENT: BlogPageContent = {
  empty: {
    title: "No posts yet",
    description: "Check back soon — new articles are on the way.",
  },
  allLabel: "All",
  moreArticles: "More articles",
  cta: {
    title: "Want these systems working for your business?",
    button: "Book a Free 15-Min Audit",
  },
  detail: {
    back: "← All Posts",
    minRead: "min read",
    writtenBy: "Written by",
    authorBio: "AI automation specialist building systems for businesses worldwide.",
    getInTouch: "Get in touch",
    keepReading: "Keep reading",
    moreSubtitle: "More articles on the same topics.",
    ctaTitle: "Want systems like the ones I write about, built for your business?",
    ctaButton: "Book a Free 15-Min Audit",
  },
};
