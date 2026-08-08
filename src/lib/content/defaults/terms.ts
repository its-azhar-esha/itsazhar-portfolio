export interface TermsSection {
  title: string;
  body: string;
}

export interface TermsPageContent {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: TermsSection[];
  contactTitle: string;
  contactBody: string;
}

export const DEFAULT_TERMS_CONTENT: TermsPageContent = {
  title: "Terms & Conditions",
  intro:
    "These terms and conditions outline the rules and regulations for the use of the website and the services provided by Azhar Mahmud (ItsAzhar). By accessing this website, you accept these terms in full. If you disagree with any part of these terms, please do not use this website.",
  lastUpdated: "August 2026",
  sections: [
    {
      title: "1. Introduction",
      body: "This website is operated by Azhar Mahmud (ItsAzhar). The following terms and conditions apply to all visitors, users, and clients who access the website or engage the services offered, including AI automation consulting, n8n workflow development, AI agents, and API integrations.",
    },
    {
      title: "2. Services",
      body: "Services include the design, development, and deployment of automation systems, workflows, AI agents, and integrations. All service engagements are confirmed via a written proposal or agreement. Scope, deliverables, timelines, and pricing are defined in that agreement and prevail over any general description on this website.",
    },
    {
      title: "3. Intellectual Property",
      body: "All content on this website — including text, graphics, logos, and code — is the property of Azhar Mahmud (ItsAzhar) unless otherwise stated. You may not reproduce, distribute, or modify any part of this website without prior written consent.",
    },
    {
      title: "4. Client Responsibilities",
      body: "You agree to provide accurate information and timely access to the accounts, systems, and credentials required to deliver the services. You are responsible for maintaining the confidentiality of your own account credentials and for any activity that occurs under them.",
    },
    {
      title: "5. Payments & Refunds",
      body: "Payment terms are agreed per engagement. Unless stated otherwise, a deposit may be required before work begins and the balance is due upon delivery or per an agreed schedule. Refund eligibility is determined by the progress of the work and the specific agreement; completed work is generally non-refundable.",
    },
    {
      title: "6. Limitations of Liability",
      body: "The services are provided on an 'as is' and 'as available' basis. To the maximum extent permitted by law, Azhar Mahmud (ItsAzhar) is not liable for any indirect, incidental, or consequential damages arising from the use of the website or the services. While automations are built and tested to be reliable, no automation is guaranteed error-free.",
    },
    {
      title: "7. Third-Party Services",
      body: "Automation systems may depend on third-party platforms such as n8n, OpenAI, Google, Supabase, and other tools. Availability and reliability of these platforms are outside our control. We are not responsible for changes to third-party pricing, features, or terms.",
    },
    {
      title: "8. Confidentiality",
      body: "We treat client business information and data as confidential and will not share it with third parties except as required to deliver the services or by law. Client data is only used for the purpose of building and maintaining the agreed automation systems.",
    },
    {
      title: "9. Termination",
      body: "Either party may terminate an engagement by written notice according to the terms of the agreement. Upon termination, outstanding invoices remain due for work already completed.",
    },
    {
      title: "10. Governing Law",
      body: "These terms and conditions are governed by and construed in accordance with applicable laws, and any disputes are subject to the jurisdiction of the relevant courts.",
    },
    {
      title: "11. Changes to These Terms",
      body: "We may update these terms from time to time. Any changes will be posted on this page with an updated 'Last Updated' date. Continued use of the website after changes are posted constitutes acceptance of the revised terms.",
    },
  ],
  contactTitle: "Contact",
  contactBody:
    "If you have any questions about these Terms & Conditions, you can contact us at azhar@itsazhar.com.",
};
