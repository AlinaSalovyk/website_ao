export type ProgramLevelTitle = "Бакалаврат" | "Магістратура" | "Аспірантура";

export interface ProgramLevelProgram {
  label: string;
  title: string;
  link?: string;
}

export interface ProgramLevel {
  id: string;
  title: ProgramLevelTitle;
  programs: ProgramLevelProgram[];
}
