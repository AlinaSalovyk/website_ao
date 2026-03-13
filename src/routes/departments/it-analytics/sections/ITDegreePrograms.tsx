import { DegreePrograms } from "@/components/sections/DegreePrograms";
import type { ProgramLevel } from "@/components/sections/degree-programs.types";

const programsData: ProgramLevel[] = [
  {
    id: "01",
    title: "Бакалаврат",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"Робототехніка та машинне навчання"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_robototekhnika_ta_mashynne_navchannia/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Штучний інтелект та аналітика даних"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_shtuchnyi_intelekt_ta_analityka_danykh/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Комп\'ютерні науки"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/f3_kompiuterni_nauky/",
      },
      {
        label: "освітньо-професійна програма",
        title: '"Економічна кібернетика"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/051_ekonomichna_kibernetyka/",
      },
    ],
  },
  {
    id: "02",
    title: "Магістратура",
    programs: [
      {
        label: "освітньо-професійна програма",
        title: '"Управління проєктами"',
        link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/122_upravlinnia_proiektamy/",
      },
    ],
  },
  {
    id: "03",
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

export const ITDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
