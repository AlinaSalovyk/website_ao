export type ProgramLevelTitle = string;

export type ProgramType = "OPP" | "ONP";

export interface ProgramLevelProgram {
  programType: ProgramType;
  label: string;
  title: string;
  titleKey?: string;
  link?: string;
}

export interface ProgramLevel {
  id: string;
  title: ProgramLevelTitle;
  programs: ProgramLevelProgram[];
}
