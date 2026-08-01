export interface ServicesHeroContent {
  badge: string;
  title: string;
  intro: string;
}

export interface ServicesDetailContent {
  back: string;
  included: string;
  badge: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
}

export interface ServicesPageContent {
  hero: ServicesHeroContent;
  learnMore: string;
  emptyMessage: string;
  detail: ServicesDetailContent;
}

export const DEFAULT_SERVICES_CONTENT: ServicesPageContent = {
  hero: {
    badge: "Services",
    title: "What I build.",
    intro:
      "Intelligent automation systems designed around real business needs. From AI agents to workflow orchestration, I build scalable solutions that reduce manual effort and improve efficiency.",
  },
  learnMore: "Learn more",
  emptyMessage: "Services are coming soon. Check back shortly.",
  detail: {
    back: "← All Services",
    included: "What's included",
    badge: "Free Consultation",
    ctaTitle: "Need something like this for your business?",
    ctaDescription:
      "Let's explore how this service can be adapted to your exact workflow — book a free 15-minute automation audit.",
    ctaButton: "Book a Free 15-Min Audit",
  },
};
