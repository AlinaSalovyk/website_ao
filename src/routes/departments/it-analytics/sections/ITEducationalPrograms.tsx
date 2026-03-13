import type { JSX } from "react";

import { EducationalPrograms } from "@/components/sections/EducationalPrograms";
import type { EducationalProgramsData } from "@/components/sections/educational-programs.types";

const educationalProgramsData: EducationalProgramsData = {
  sectionId: "general-info",
  title: "Загальна інформація про кафедру",
  image: {
    src: "/images/IT/information.jpg",
    alt: "Abstract blue graphic",
  },
  introText:
    "Ми готуємо висококваліфікованих фахівців у сфері штучного інтелекту, робототехніки, аналітики даних та машинного навчання. Наші студенти не просто засвоюють теорію, а й отримують реальний досвід, працюючи над актуальними проєктами та співпрацюючи з провідними компаніями.",
  columns: [
    "Наші викладачі — це не лише теоретики, а й практики, які постійно вдосконалюють свої навички в реальному секторі економіки, міжнародних наукових проєктах та стажуваннях. Вони навчають студентів не просто аналізувати дані, а створювати інтелектуальні системи, які прогнозують, оптимізують та приймають рішення.",
    "Освітні програми кафедри охоплюють широкий спектр дисциплін — від основ програмування до складних алгоритмів штучного інтелекту. Особлива увага приділяється практичному застосуванню набутих знань, які роблять вас затребуваними на ринку праці. Ми вважаємо, що справжній фахівець не є лише виконавцем, а є новатором, який шукає нестандартні рішення та втілює сміливі ідеї.",
  ],
};

export const ITEducationalPrograms = (): JSX.Element => {
  return <EducationalPrograms data={educationalProgramsData} />;
};
