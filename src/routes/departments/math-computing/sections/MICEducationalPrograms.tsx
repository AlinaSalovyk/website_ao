import type { JSX } from "react";

import { EducationalPrograms } from "@/components/sections/EducationalPrograms";
import type { EducationalProgramsData } from "@/components/sections/educational-programs.types";

const educationalProgramsData: EducationalProgramsData = {
  sectionId: "general-info",
  title: "Загальна інформація про кафедру",
  image: {
    src: "/images/Departments/dfb-info.jpg",
    alt: "Mathematics and computing",
  },
  introText:
    "Ми готуємо висококваліфікованих фахівців у сфері математики, прикладних обчислень, моделювання та алгоритмічного аналізу. Наші студенти не лише опановують теоретичні основи, а й здобувають практичний досвід, працюючи над реальними дослідницькими проєктами та аналітичними завданнями, співпрацюючи з провідними науковими та інноваційними центрами.",
  columns: [
    "Сьогодні математична грамотність — це базова вимога цифрової епохи, яка визначає здатність людини до аналізу, логічного мислення та прогнозування майбутнього. Кафедра математики та інтелектуальних обчислень — це простір, де розвивається вміння прораховувати на кілька кроків вперед, перетворюючи складні виклики на чіткі алгоритми успіху.",
    "Освітні програми кафедри охоплюють широкий спектр дисциплін — від математичного аналізу та алгебри до нейронних мереж та машинного навчання. Особлива увага приділяється практичному застосуванню математичних знань для розв'язання реальних задач науки та бізнесу.",
  ],
};

export const MICEducationalPrograms = (): JSX.Element => {
  return <EducationalPrograms data={educationalProgramsData} />;
};
