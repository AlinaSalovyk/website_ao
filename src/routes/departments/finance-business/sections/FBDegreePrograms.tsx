import { DegreePrograms } from "@/components/sections/DegreePrograms";
import type { ProgramLevel } from "@/components/sections/degree-programs.types";

const programsData: ProgramLevel[] = [
  {
    id: "01",
    title: "Бакалаврат",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"Фінанси та бізнес-аналітика"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/d2_finansy_ta_biznes-analityka/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Підприємництво та торгівля"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/076_pidpryiemnytstvo_ta_torhivlia/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Підприємництво та управління бізнесом"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/d3_pidpryiemnytstvo_ta_upravlinnia_biznesom/",
      },
    ],
  },
  {
    id: "02",
    title: "Магістратура",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"Фінанси та бізнес-аналітика"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/d2_finansy_ta_biznes-analityka/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Облік і оподаткування"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/d1_oblik_i_opodatkuvannia/",
      },
    ],
  },
];

export const FBDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
