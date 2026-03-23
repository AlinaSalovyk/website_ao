export interface HomeEducationalSpeciality {
  name: string;
  link?: string;
}

export interface HomeEducationalProgram {
  id: string;
  title: string;
  specialities: HomeEducationalSpeciality[];
  image: string;
}

export interface HomeEducationalProgramsData {
  sectionId?: string;
  title: string;
  specialitiesLabel?: string;
  programs: HomeEducationalProgram[];
}
