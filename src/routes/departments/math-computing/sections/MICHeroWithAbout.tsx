import type { JSX } from "react";

import { HeroWithAbout } from "@/components/sections/HeroWithAbout";
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";

const heroWithAboutData: HeroWithAboutData = {
  heroTitle: "Кафедра математики та інтелектуальних обчислень",
  heroDescription:
    "Кафедра математики та інтелектуальних обчислень — це простір, де логіка та аналітичне мислення поєднуються з сучасними методами моделювання та алгоритмічного аналізу.",
  cta: {
    label: "Дізнатися більше",
    href: "#general-info",
  },
  sectionId: "about",
  breadcrumbLabel: "ІНСТИТУТ ІНФОРМАЦІЙНИХ ТЕХНОЛОГІЙ ТА БІЗНЕСУ",
  aboutParagraphs: [
    "Математика — це мова Всесвіту. Ми навчаємо розуміти цю мову та застосовувати її для розв'язання найскладніших задач сучасності за допомогою інтелектуальних обчислень.",
    "Відкрий світ математичних можливостей разом з нами!",
  ],
  aboutImage: {
    src: "/images/Departments/dmc-hero.jpg",
    alt: "Студенти за роботою",
    width: 4096,
    height: 2732,
  },
  backgroundShapeImage: {
    src: "/images/IT/3D Black Chrome Shape1.png",
    alt: "Element black chrome",
    width: 1426,
    height: 1456,
  },
  backgroundShapeFilter: "hue-rotate(-50deg) brightness(1.0) saturate(9.0)",
};

export const MICHeroWithAbout = (): JSX.Element => {
  return <HeroWithAbout data={heroWithAboutData} />;
};
