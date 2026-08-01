export interface HeroContent {
  basic: HeroBasic;
  actions: HeroActions;
  badges: string[];
  background: HeroBackground;
  seo: HeroSeo;
}

export interface HeroBasic {
  headline: string;
  highlight: string;
  subheadline: string;
  availability: string;
  location: string;
}

export interface HeroActions {
  primary: HeroAction;
  secondary: HeroAction;
}

export interface HeroAction {
  label: string;
  href: string;
}

export interface HeroMetric {
  value: string;
  label: string;
}

export interface HeroBackground {
  image: string;
  video: string;
}

export interface HeroSeo {
  title: string;
  description: string;
}
