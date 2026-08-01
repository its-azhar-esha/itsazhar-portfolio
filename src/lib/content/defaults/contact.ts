export interface ContactHeroContent {
  badge: string;
  title: string;
  intro: string;
}

export interface ContactAuditContent {
  price: string;
  title: string;
  description: string;
}

export interface ContactDetailsContent {
  findMeOn: string;
  details: string;
  location: string;
  responseTime: string;
}

export interface ContactFormContent {
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
}

export interface ContactFormSuccessContent {
  title: string;
  description: string;
}

export interface ContactPageContent {
  hero: ContactHeroContent;
  benefits: string[];
  audit: ContactAuditContent;
  bookLabel: string;
  details: ContactDetailsContent;
  form: ContactFormContent;
  formSuccess: ContactFormSuccessContent;
}

export const DEFAULT_CONTACT_CONTENT: ContactPageContent = {
  hero: {
    badge: "Let's work together",
    title: "Let's automate something.",
    intro:
      "Have a repetitive process slowing your business down? Book a free 15-minute automation audit. I'll review your workflow, identify automation opportunities, and suggest the right approach — with no pressure and no obligation.",
  },
  benefits: [
    "Identify repetitive tasks",
    "Find automation opportunities",
    "Get actionable recommendations",
    "No charge",
    "No obligation",
  ],
  audit: {
    price: "Free",
    title: "Free Automation Audit",
    description: "15-minute call to discover automation opportunities in your business workflow.",
  },
  bookLabel: "Book Free 15-Min Audit",
  details: {
    findMeOn: "Find me on",
    details: "Details",
    location: "Remote, Worldwide",
    responseTime: "Response Time: Within 24 Hours",
  },
  form: {
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone (optional)",
    phonePlaceholder: "Your phone number",
    messageLabel: "What would you like to automate? (optional)",
    messagePlaceholder: "Tell me a little about your workflow...",
    submitLabel: "Book Free 15-Min Audit",
    sendingLabel: "Sending...",
  },
  formSuccess: {
    title: "Audit requested!",
    description:
      "Thanks for reaching out — I'll get back to you within 24 hours to schedule your free audit.",
  },
};
