export interface PrivacySection {
  title: string;
  body: string;
}

export interface PrivacyPageContent {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: PrivacySection[];
  contactTitle: string;
  contactBody: string;
}

export const DEFAULT_PRIVACY_CONTENT: PrivacyPageContent = {
  title: "Privacy Policy",
  intro:
    "This privacy policy explains what information is collected when you visit this website, how it is used, and the choices you have. It applies to the website operated by Azhar Mahmud (ItsAzhar). By using this website you agree to the practices described below.",
  lastUpdated: "August 2026",
  sections: [
    {
      title: "1. Information You Provide",
      body: "When you submit the contact form, you provide your name, email address, and — if you choose — a phone number and a message. This information is stored in a private database and is only used to respond to your enquiry. It is never sold or shared for marketing purposes. If you use the AI chat assistant and share your email address with booking intent, that email (and your name, if shared) is also saved as a lead so we can follow up with you.",
    },
    {
      title: "2. AI Chat Assistant",
      body: "The AI chat assistant on this website answers questions using your conversation and site content. Your messages are sent to third-party AI providers (currently Groq, with OpenRouter as a fallback) to generate the reply. Conversations are not stored on this website after the chat session ends. To prevent abuse, the chat endpoint keeps a rate-limit counter per visitor that stores only a one-way hash of your IP address — the raw IP is never stored.",
    },
    {
      title: "3. Analytics",
      body: "This website uses Google Analytics (GA4) to understand how visitors use the site. Google Analytics may set cookies and collect information such as pages visited, approximate location, device type, browser, and referral source. The data is used in aggregate to improve the site and is subject to Google's privacy policy. Additionally, basic analytics events (page views, button clicks, search queries on the Automation Hub) are stored in our own database with a random session identifier — your IP address is not stored with these events.",
    },
    {
      title: "4. Cookies & Local Storage",
      body: "The website does not use cookies for essential functionality. Your browser may store small amounts of data locally on your device: a theme preference, chat usage counters for the AI assistant, and a temporary session identifier used by analytics. These are stored only on your device and can be cleared at any time through your browser settings. The admin area (accessible only to the site owner) uses an authentication session cookie.",
    },
    {
      title: "5. Where Data Is Stored",
      body: "Data is hosted on Supabase (PostgreSQL database and file storage, ap-southeast-1 region) and the website itself is hosted on Vercel. These providers process data only to provide their services. Backups of the database and stored files are created automatically and kept in a private storage bucket, with a copy maintained on a private GitHub repository.",
    },
    {
      title: "6. Data Retention",
      body: "Contact form and chat leads are kept indefinitely or until deleted via the admin panel. Analytics events are retained for 90 days and then automatically pruned. You may request deletion of any personal data we hold about you at any time.",
    },
    {
      title: "7. Your Rights",
      body: "You have the right to request access to, correction of, or deletion of the personal data we hold about you. To exercise any of these rights, contact us using the details below. You can also disable or block Google Analytics via the official Google Analytics opt-out browser add-on.",
    },
    {
      title: "8. Children's Privacy",
      body: "This website is not directed at children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it.",
    },
    {
      title: "9. Changes to This Policy",
      body: "We may update this privacy policy from time to time. Any changes will be posted on this page with an updated 'Last Updated' date. Continued use of the website after changes are posted constitutes acceptance of the revised policy.",
    },
  ],
  contactTitle: "Contact",
  contactBody:
    "If you have any questions about this Privacy Policy or your data, you can contact us at azhar@itsazhar.com.",
};
