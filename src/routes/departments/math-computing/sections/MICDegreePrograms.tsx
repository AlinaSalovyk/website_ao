import DegreePrograms from "@/components/sections/DegreePrograms";
import type { ProgramLevel } from "@/components/sections/degree-programs.types";

const programsData: ProgramLevel[] = [
  {
    id: "01",
    title: "Аспірантура",
    programs: [
      {
        label: "освітньо-наукова програма",
        title: '"Прикладна математика"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/",
      },
    ],
  },
];

export const MICDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
