import { BarChart3, FileText, GraduationCap } from "lucide-react";

export const CASE_STUDY_ICONS = {
  fleet: BarChart3,
  lease: FileText,
  education: GraduationCap,
} as const;

export type CaseStudyIconName = keyof typeof CASE_STUDY_ICONS;

export const CASE_STUDY_ICON_NAMES = Object.keys(CASE_STUDY_ICONS) as CaseStudyIconName[];

export const CASE_STUDY_STATUSES = ["draft", "published"] as const;

export type CaseStudyStatus = (typeof CASE_STUDY_STATUSES)[number];

export const CASE_STUDY_DEFAULTS = {
  STATUS: "draft" as CaseStudyStatus,
  ICON: "fleet" as CaseStudyIconName,
  DISPLAY_ORDER: 0,
} as const;
