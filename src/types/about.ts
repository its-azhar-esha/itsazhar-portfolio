export interface AboutContent {
  basic: AboutBasic;
  biography: AboutBiography;
  buildSteps: AboutBuildStep[];
  tools: AboutTool[];
  industries: string[];
  timeline: AboutTimelineEntry[];
  principles: AboutPrinciple[];
  socialLinks: AboutSocialLink[];
  resume: AboutResume;
  seo: AboutSeo;
}

export interface AboutBasic {
  name: string;
  title: string;
  tagline: string;
  profileImage: string;
  introVideoUrl: string;
}

export interface AboutBiography {
  headline: string;
  paragraphs: string[];
  missionStatement: string;
  visionStatement: string;
  roles: string[];
}

export interface AboutBuildStep {
  icon: string;
  title: string;
  description: string;
}

export interface AboutTool {
  name: string;
  icon?: string;
  category: string;
}

export interface AboutTimelineEntry {
  year: string;
  title: string;
  description: string;
}

export interface AboutPrinciple {
  title: string;
  description: string;
}

export interface AboutSocialLink {
  name: string;
  username: string;
  url: string;
  placeholder: boolean;
}

export interface AboutResume {
  label: string;
  url: string;
}

export interface AboutSeo {
  title: string;
  description: string;
}
