import type { JSX } from "react";
import { HomeEducationalPrograms } from "@/components/sections/HomeEducationalPrograms";
import type { HomeEducationalProgramsData } from "@/components/sections/home-educational-programs.types";

const educationalProgramsData: HomeEducationalProgramsData = {
  sectionId: "educational-programs",
  title: "Спеціальності та освітні програми",
  specialtiesLabel: "Перелік спеціальностей",
  programs: [
    {
      id: "bachelor",
      title: "Бакалаврат",
      specialties: [
        {
          name: "D2 «Фінанси, банківська справа, страхування та фондовий ринок» (ОПП «Фінанси та бізнес-аналітика»)",
          link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya",
        },
        {
          name: "F3 «Комп'ютерні науки» (ОПП «Комп'ютерні науки»)",
          link: "https://vstup.oa.edu.ua/specialnosti/kompyuterni-nauki",
        },
        {
          name: "D3 «Менеджмент» (ОПП «Підприємництво та управління бізнесом»)",
          link: "https://vstup.oa.edu.ua/specialnosti/business_and_trade",
        },
        {
          name: "F3 «Комп'ютерні науки» (ОПП «Програмування роботизованих систем» (Робототехніка))",
          link: "https://vstup.oa.edu.ua/specialnosti/robotics_and_machine_learning",
        },
        {
          name: "D5 «Маркетинг» (ОПП «DATA-маркетинг та аналітика»)",
          link: "https://vstup.oa.edu.ua/specialnosti/data-marketing-ta-analitika",
        },
      ],
      image: "/images/EducationalPrograms/BachelorsDegree.png",
    },
    {
      id: "master",
      title: "Магістратура",
      specialties: [
        {
          name: "D2 «Фінанси, банківська справа та страхування» (ОПП «Фінанси та бізнес-аналітика»)",
          link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya",
        },
        {
          name: "D3 «Менеджмент» (ОПП «Менеджмент продажів та логістика»)",
          link: "https://vstup.oa.edu.ua/specialnosti/menedzhment-prodazhiv-ta-logistika",
        },
        {
          name: "F3 «Комп'ютерні науки» (ОПП «Управління IT-проєктами»)",
          link: "https://vstup.oa.edu.ua/specialnosti/upravlinnya-proektami",
        },
        {
          name: "D3 «Менеджмент» (ОПП «HR-менеджмент»)",
          link: "https://vstup.oa.edu.ua/specialnosti/hr-menedzhment",
        },
        {
          name: "D1 «Облік і оподаткування» (ОПП «Облік і оподаткування»)",
          link: "https://vstup.oa.edu.ua/specialnosti/oblik-i-opodatkuvannya",
        },
      ],
      image: "/images/EducationalPrograms/Magistracy.png",
    },
    {
      id: "postgraduate",
      title: "Аспірантура",
      specialties: [
        {
          name: "D3 «Менеджмент» (ОНП «Менеджмент»)",
          link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/d3_menedzhment/",
        },
        {
          name: "F1 «Прикладна математика» (ОНП «Прикладна математика»)",
          link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/",
        },
      ],
      image: "/images/EducationalPrograms/PostgraduateStudies.png",
    },
  ],
};

export const EducationalPrograms = (): JSX.Element => {
  return <HomeEducationalPrograms data={educationalProgramsData} />;
};
