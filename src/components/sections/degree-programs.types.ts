export type ProgramLevelTitle = "Бакалаврат" | "Магістратура" | "Аспірантура";

export type ProgramType = "OPP" | "ONP";

export interface ProgramLevelProgram {
  programType: ProgramType;
  label: string;
  title: string;
  link?: string;
}

export interface ProgramLevel {
  id: string;
  title: ProgramLevelTitle;
  programs: ProgramLevelProgram[];
}
