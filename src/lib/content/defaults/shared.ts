export interface SharedNavContent {
  ctaLabel: string;
  fallbackLinks: { label: string; href: string }[];
}

export interface SharedMobileContent {
  more: string;
  aiAssistant: string;
  theme: string;
  ctaLabel: string;
  contact: string;
  caseStudies: string;
  testimonials: string;
  blog: string;
  hub: string;
  playground: string;
}

export interface SharedFooterContent {
  intro: string;
  quickLinksTitle: string;
  blogLabel: string;
  hubLabel: string;
  playgroundLabel: string;
  ctaTitle: string;
  ctaDescription: string;
  primaryButton: string;
  secondaryButton: string;
}

export interface SharedLeadFormContent {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  sendingLabel: string;
  successTitle: string;
  successDescription: string;
}

export interface SharedContent {
  brand: { name: string };
  nav: SharedNavContent;
  mobile: SharedMobileContent;
  footer: SharedFooterContent;
  leadForm: SharedLeadFormContent;
  maintenance: { title: string; description: string };
}

export const DEFAULT_SHARED_CONTENT: SharedContent = {
  brand: {
    name: "Azhar",
  },
  nav: {
    ctaLabel: "Book a Free 15-Min Audit",
    fallbackLinks: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/#services" },
      { label: "Projects", href: "/projects" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  mobile: {
    more: "More",
    aiAssistant: "AI Assistant",
    theme: "Theme",
    ctaLabel: "Book a Free 15-Min Audit",
    contact: "Contact",
    caseStudies: "Case Studies",
    testimonials: "Testimonials",
    blog: "Blog",
    hub: "Hub",
    playground: "Playground",
  },
  footer: {
    intro:
      "I build AI automation systems that eliminate repetitive work, connect business tools, and help teams operate smarter through AI agents, workflows, and intelligent integrations.",
    quickLinksTitle: "Quick Links",
    blogLabel: "Blog",
    hubLabel: "Automation Hub",
    playgroundLabel: "Workflow Playground",
    ctaTitle: "Stop wasting time. Start automating.",
    ctaDescription:
      "Book a free 15-minute audit and discover what automation can do for your business.",
    primaryButton: "Book Free Audit",
    secondaryButton: "View Projects",
  },
  leadForm: {
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    phoneLabel: "Phone (optional)",
    phonePlaceholder: "+1 234 567 890",
    messageLabel: "What would you like to automate? (optional)",
    messagePlaceholder: "Tell me a little about your workflow...",
    submitLabel: "Book Free 15-Min Audit",
    sendingLabel: "Sending...",
    successTitle: "Audit requested!",
    successDescription:
      "Thanks for reaching out. I'll get back to you within 24 hours to schedule your free 15-minute automation audit.",
  },
  maintenance: {
    title: "Under Maintenance",
    description: "The site is temporarily down for maintenance. Please check back soon.",
  },
};
