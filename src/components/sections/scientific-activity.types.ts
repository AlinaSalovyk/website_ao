import type { ReactNode } from "react";

export interface ScientificActivityImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type ScientificActivityHeadingVariant = "compact" | "display";
export type ScientificActivityContentSpacing = "my" | "mt";
export type ScientificActivityImageFit = "cover" | "contain";

export interface ScientificActivityData {
  sectionId?: string;
  title: string;
  description: ReactNode;
  image: ScientificActivityImage;
  headingVariant?: ScientificActivityHeadingVariant;
  contentSpacing?: ScientificActivityContentSpacing;
  imageFit?: ScientificActivityImageFit;
}
