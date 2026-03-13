export interface HeroWithAboutImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface HeroWithAboutCta {
  label: string;
  href: string;
}

export interface HeroWithAboutData {
  heroTitle: string;
  heroDescription: string;
  cta: HeroWithAboutCta;
  breadcrumbLabel: string;
  aboutParagraphs: string[];
  aboutImage: HeroWithAboutImage;
  sectionId?: string;
  backgroundShapeImage?: HeroWithAboutImage;
  backgroundShapeFilter?: string;
}
