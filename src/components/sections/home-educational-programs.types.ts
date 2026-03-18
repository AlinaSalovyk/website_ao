export interface HomeEducationalSpecialty {
  name: string;
  link?: string;
}

export interface HomeEducationalProgram {
  id: string;
  title: string;
  specialties: HomeEducationalSpecialty[];
  image: string;
}

export interface HomeEducationalProgramsData {
  sectionId?: string;
  title: string;
  specialtiesLabel?: string;
  programs: HomeEducationalProgram[];
}
