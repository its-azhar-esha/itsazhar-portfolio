export const site = {
  name: "Azhar",
  title: "AI Automation Specialist",
  domain: "https://azhar.dev",
  description:
    "I build intelligent AI automation systems using AI agents, n8n workflows, and API integrations that eliminate repetitive work, streamline operations, and help businesses scale faster.",

  seo: {
    title: "Azhar | Automate Anything — AI Automation Specialist",
    titleTemplate: "%s | Azhar | AI Automation Systems",
    keywords: [
      "AI automation specialist",
      "workflow automation",
      "n8n developer",
      "AI agents",
      "business automation",
      "process automation",
      "API integration",
      "Supabase",
      "automation consultant",
      "Bangladesh automation developer",
    ],
    ogImage: "/og.jpg",
    twitterHandle: "@azhar_m_alif",
  },

  analytics: {
    googleMeasurementId: "G-XXXXXXXXXX",
    googleTagManagerId: "GTM-XXXXXXX",
    clarityId: "CLARITY_ID",
  },

  theme: {
    color: "#09090b",
    defaultTheme: "dark" as const,
    enableSystem: false,
  },

  author: {
    name: "Azhar Mahmud Alif",
    email: "azhar@example.com",
    jobTitle: "AI Automation Specialist",
    location: "Bangladesh",
    available: true,
  },

  contact: {
    booking: {
      provider: "calendly" as const,
      url: "https://calendly.com/azhar/15min",
    },
    responseTime: "Within 24 Hours",
  },
} as const;
