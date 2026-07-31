import type { CaseStudyIconName, CaseStudyStatus } from "@/constants/case-studies";

export interface DbCaseStudy {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export type CreateCaseStudyInput = Omit<DbCaseStudy, "id" | "created_at" | "updated_at">;
export type UpdateCaseStudyInput = Partial<Omit<DbCaseStudy, "id" | "created_at" | "updated_at">>;

export interface PublicCaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  challenge: string;
  solution: string;
  workflow: string[];
  impact: string;
  icon: CaseStudyIconName;
  display_order: number;
}
