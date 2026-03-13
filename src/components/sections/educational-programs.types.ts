export interface EducationalProgramsImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type EducationalProgramsTitleAlign = "left" | "right";

export interface EducationalProgramsData {
  sectionId?: string;
  title: string;
  titleAlign?: EducationalProgramsTitleAlign;
  introText: string;
  columns: string[];
  image: EducationalProgramsImage;
}
