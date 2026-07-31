import type { CaseStudyIconName, CaseStudyStatus } from "@/constants/case-studies";
import type { PublicCaseStudy } from "@/types/case-study";

export interface MockCaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  challenge: string;
  solution: string;
  workflow: string[];
  impact: string;
  icon: CaseStudyIconName;
  display_order: number;
  status: CaseStudyStatus;
}

export const MOCK_CASE_STUDIES: MockCaseStudy[] = [
  {
    slug: "fleet-intelligence-system",
    title: "Fleet Intelligence System",
    subtitle: "Logistics AI",
    challenge: "Manual fleet monitoring was reactive, slow, and prone to missed incidents.",
    solution:
      "A real-time AI system that analyzes fleet activity, detects risks, and provides instant operational insights.",
    workflow: [
      "Tracks vehicle and driver data",
      "AI analyzes route behavior, delays, and anomalies",
      "Automatically flags issues and sends alerts",
      "Built with n8n + Supabase + LLM-based analysis",
    ],
    impact: "Transformed manual fleet monitoring into an intelligent automated safety system.",
    icon: "fleet",
    display_order: 1,
    status: "published",
  },
  {
    slug: "lease-intelligence-system",
    title: "Lease Intelligence System",
    subtitle: "Real Estate AI",
    challenge: "Manual lease review was slow, inconsistent, and easy to miss critical clauses.",
    solution:
      "Automated extraction of important lease information from PDFs with structured summaries.",
    workflow: [
      "Extracts clauses like rent, renewal, and termination",
      "Processes PDF documents automatically",
      "Generates structured summaries",
      "Stores business data securely",
    ],
    impact: "Reduces manual document review and helps prevent missed contract details.",
    icon: "lease",
    display_order: 2,
    status: "published",
  },
  {
    slug: "education-automation-system",
    title: "Education Automation System",
    subtitle: "EdTech SaaS",
    challenge: "Manual school processes were scattered, error-prone, and difficult to scale.",
    solution: "An automation-first system built using n8n workflows for school operations.",
    workflow: [
      "Handles student/admin workflows",
      "Automates notifications",
      "Processes data using AI",
      "Uses PostgreSQL database",
    ],
    impact:
      "Shows how scalable SaaS-like systems can be created using automation-first architecture.",
    icon: "education",
    display_order: 3,
    status: "published",
  },
];

export function toPublicCaseStudy(cs: {
  slug: string;
  title: string;
  subtitle: string;
  challenge: string;
  solution: string;
  workflow: string[];
  impact: string;
  icon: CaseStudyIconName;
  display_order: number;
}): PublicCaseStudy {
  return {
    slug: cs.slug,
    title: cs.title,
    subtitle: cs.subtitle,
    challenge: cs.challenge,
    solution: cs.solution,
    workflow: cs.workflow,
    impact: cs.impact,
    icon: cs.icon,
    display_order: cs.display_order,
  };
}
