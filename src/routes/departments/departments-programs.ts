import type { ProgramLevel } from "@/components/sections/degree-programs.types";
import type { Translations } from "@/i18n";

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
            titleKey: "robotics",
            title: '"Робототехніка та машинне навчання"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_robototekhnika_ta_mashynne_navchannia/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "ai",
            title: '"Штучний інтелект та аналітика даних"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/122_shtuchnyi_intelekt_ta_analityka_danykh/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "cs",
            title: '"Комп\'ютерні науки"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/f3_kompiuterni_nauky/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "cybernetics",
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
            titleKey: "projectManagement",
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
            titleKey: "appliedMath",
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
            titleKey: "financeAnalytics",
            title: '"Фінанси та бізнес-аналітика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/d2_finansy_ta_biznes-analityka/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "entrepreneurshipTrade",
            title: '"Підприємництво та торгівля"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/bachelor/itb/076_pidpryiemnytstvo_ta_torhivlia/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "entrepreneurshipBusiness",
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
            titleKey: "financeAnalytics",
            title: '"Фінанси та бізнес-аналітика"',
            link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/mag/itb/d2_finansy_ta_biznes-analityka/",
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "accountingTax",
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
            titleKey: "dataMarketing",
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
            titleKey: "hrManagement",
            title: '"HR-менеджмент"',
          },
          {
            programType: "OPP",
            label: "освітньо-професійна програма",
            titleKey: "salesLogistics",
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
            titleKey: "management",
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
            titleKey: "appliedMath",
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

const LEVEL_TITLE_KEY: Record<string, keyof Translations["educationLevels"]> = {
  Бакалаврат: "bachelor",
  Магістратура: "master",
  Аспірантура: "postgraduate",
};

export function getDepartments(t: Translations): DepartmentData[] {
  return DEPARTMENTS.map((dept) => ({
    ...dept,
    title: t.departments[dept.id as keyof typeof t.departments] as string,
    programs: dept.programs.map((level) => ({
      ...level,
      title: t.educationLevels[LEVEL_TITLE_KEY[level.title] ?? "bachelor"],
      programs: level.programs.map((prog) => ({
        ...prog,
        label:
          prog.programType === "OPP"
            ? t.educationLevels.opp
            : t.educationLevels.onp,
        title: prog.titleKey
          ? t.programTitles[prog.titleKey as keyof typeof t.programTitles]
          : prog.title,
      })),
    })),
  }));
}

export function getLocalizedDepartmentPrograms(
  departmentId: DepartmentId,
  t: Translations,
): ProgramLevel[] {
  const departments = getDepartments(t);
  const department = departments.find((item) => item.id === departmentId);
  return department ? department.programs : [];
}
