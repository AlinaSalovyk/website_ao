import type { ProgramLevel } from "@/components/sections/degree-programs.types";

export type DepartmentId = "finance" | "management" | "it" | "math";

export interface DepartmentData {
  id: DepartmentId;
  title: string;
  programs: ProgramLevel[];
  departmentLink?: string;
}

export const DEPARTMENTS: DepartmentData[] = [
  {
    id: "it",
    title: "Кафедра інформаційних технологій та аналітики даних",
    departmentLink: "/information-technologies-and-data-analytics",
    programs: [
      {
        id: "01",
        title: "Бакалаврат",
        programs: [
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Робототехніка та машинне навчання"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_robototekhnika_ta_mashynne_navchannia/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Штучний інтелект та аналітика даних"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_shtuchnyi_intelekt_ta_analityka_danykh/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Комп\'ютерні науки"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/f3_kompiuterni_nauky/",
          },
          {
            programType: "OPP",
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
            programType: "OPP",
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
            programType: "ONP",
            label: "освітньо-наукова програма",
            title: '"Прикладна математика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/",
          },
        ],
      },
    ],
  },
  {
    id: "finance",
    title: "Кафедра фінансів та бізнесу",
    departmentLink: "/finance-and-business",
    programs: [
      {
        id: "01",
        title: "Бакалаврат",
        programs: [
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Фінанси та бізнес-аналітика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/d2_finansy_ta_biznes-analityka/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Підприємництво та торгівля"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/076_pidpryiemnytstvo_ta_torhivlia/",
          },
          {
            programType: "OPP",
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
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Фінанси та бізнес-аналітика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/d2_finansy_ta_biznes-analityka/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"Облік і оподаткування"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/d1_oblik_i_opodatkuvannia/",
          },
        ],
      },
    ],
  },
  {
    id: "management",
    title: "Кафедра менеджменту та маркетингу",
    departmentLink: "/management-and-marketing",
    programs: [
      {
        id: "01",
        title: "Бакалаврат",
        programs: [
          {
            programType: "OPP",
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
            programType: "OPP",
            label: "освітньо-професійна програма",
            title: '"HR-менеджмент"',
          },
          {
            programType: "OPP",
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
            programType: "ONP",
            label: "освітньо-наукова програма",
            title: '"Менеджмент"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/d3_menedzhment/",
          },
        ],
      },
    ],
  },
  {
    id: "math",
    title: "Кафедра математики та інтелектуальних обчислень",
    departmentLink: "/mathematics-and-intelligent-computing",
    programs: [
      {
        id: "01",
        title: "Аспірантура",
        programs: [
          {
            programType: "ONP",
            label: "освітньо-наукова програма",
            title: '"Прикладна математика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/",
          },
        ],
      },
    ],
  },
];

export const getDepartmentPrograms = (
  departmentId: DepartmentId,
): ProgramLevel[] => {
  const department = DEPARTMENTS.find((item) => item.id === departmentId);
  return department ? department.programs : [];
};
