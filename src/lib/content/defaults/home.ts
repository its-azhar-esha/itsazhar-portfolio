export interface HomeShowcaseContent {
  title: string;
  intro: string;
  watchDemo: string;
  viewCaseStudy: string;
  viewAll: string;
}

export interface HomeFeaturesContent {
  title: string;
  intro: string;
}

export interface HomeCaseStudiesContent {
  title: string;
  intro: string;
  challenge: string;
  solution: string;
  workflow: string;
  impact: string;
  readMore: string;
}

export interface HomeTestimonialsContent {
  title: string;
  intro: string;
}

export interface HomeAboutContent {
  name: string;
  photo: string;
  heading: string;
  role: string;
  intro: string;
  moreLabel: string;
  roles: string[];
}

export interface HomeContactContent {
  title: string;
  intro: string;
  priceBadge: string;
  auditTitle: string;
  auditDescription: string;
  benefits: string[];
  bookLabel: string;
  viewProjectsLabel: string;
  findMeOn: string;
  details: string;
  location: string;
  responseTime: string;
}

export interface HomeCtaContent {
  badge: string;
  title: string;
  intro: string;
  primaryLabel: string;
  secondaryLabel: string;
}

export interface HomePageContent {
  showcase: HomeShowcaseContent;
  features: HomeFeaturesContent;
  caseStudies: HomeCaseStudiesContent;
  testimonials: HomeTestimonialsContent;
  about: HomeAboutContent;
  contact: HomeContactContent;
  cta: HomeCtaContent;
}

export const DEFAULT_HOME_CONTENT: HomePageContent = {
  showcase: {
    title: "Featured Systems & Automation Demos",
    intro:
      "Explore AI-powered systems built to solve real operational challenges — combining automation workflows, AI agents, and intelligent integrations to create scalable business solutions.",
    watchDemo: "Watch Demo",
    viewCaseStudy: "View Case Study",
    viewAll: "View All Projects",
  },
  features: {
    title: "What I build.",
    intro:
      "Intelligent automation systems designed around real business needs. From AI agents to workflow orchestration, I build scalable solutions that reduce manual effort, improve efficiency, and help teams operate smarter.",
  },
  caseStudies: {
    title: "From manual to automated.",
    intro:
      "Each case study explains the problem, automation approach, workflow design, and business impact behind each system.",
    challenge: "The Challenge",
    solution: "The Solution",
    workflow: "Workflow",
    impact: "Impact",
    readMore: "Read Full Case Study",
  },
  testimonials: {
    title: "What clients say.",
    intro: "Real feedback from the people I've built with.",
  },
  about: {
    name: "Azhar",
    photo: "",
    heading: "Hi, I'm Azhar",
    role: "AI Automation Specialist",
    intro:
      "I build intelligent automation systems using n8n, AI agents, APIs, and custom workflows that help businesses reduce repetitive work and improve operations.",
    moreLabel: "More About Me",
    roles: [
      "AI Automation Specialist",
      "Workflow Engineer",
      "AI Systems Builder",
      "Automation Architect",
    ],
  },
  contact: {
    title: "Let's automate something.",
    intro:
      "Have a repetitive process slowing your business down? Book a free 15-minute automation audit. I'll review your workflow, identify automation opportunities, and suggest the right approach — with no pressure and no obligation.",
    priceBadge: "Free",
    auditTitle: "Free Automation Audit",
    auditDescription:
      "15-minute call to discover automation opportunities in your business workflow.",
    benefits: [
      "Identify repetitive tasks",
      "Find automation opportunities",
      "Get actionable recommendations",
      "No charge",
      "No obligation",
    ],
    bookLabel: "Book Free 15-Min Audit",
    viewProjectsLabel: "View Projects",
    findMeOn: "Find me on",
    details: "Details",
    location: "Remote, Worldwide",
    responseTime: "Response Time: Within 24 Hours",
  },
  cta: {
    badge: "Stop wasting time. Start automating.",
    title: "Ready to automate your workflow?",
    intro:
      "Let's find the automation opportunities in your business. Book a free 15-minute audit and start scaling smarter.",
    primaryLabel: "Book Free Audit",
    secondaryLabel: "View Projects",
  },
};
