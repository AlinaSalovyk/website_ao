import { DegreePrograms } from "@/components/sections/DegreePrograms";
import type { ProgramLevel } from "@/components/sections/degree-programs.types";

const programsData: ProgramLevel[] = [
  {
    id: "01",
    title: "Бакалаврат",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"Data-маркетинг та аналітика"',
      },
    ],
  },
  {
    id: "02",
    title: "Магістратура",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"HR-менеджмент"',
      },
      {
        label: "освітньо-професійна програма",
        title: '"Менеджмент продажів та логістика"',
      },
    ],
  },
  {
    id: "03",
    title: "Аспірантура",
    programs: [
      {
        label: "освітньо-наукова програма",
        title: '"Менеджмент"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/d3_menedzhment/",
      },
    ],
  },
];

export const MMDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
