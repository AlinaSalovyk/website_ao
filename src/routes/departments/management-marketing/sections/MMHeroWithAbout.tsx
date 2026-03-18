import type { JSX } from "react";

import { HeroWithAbout } from "@/components/sections/HeroWithAbout";
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";

const heroWithAboutData: HeroWithAboutData = {
  heroTitle: "Кафедра менеджменту та маркетингу",
  heroDescription:
    "Кафедра менеджменту та маркетингу — це простір, де класичні та сучасні підходи до управління поєднуються з практичними навичками стратегічного планування, маркетингових комунікацій та розвитку бізнесу.",
  cta: {
    label: "Дізнатися більше",
    href: "#general-info",
  },
  sectionId: "about",
  breadcrumbLabel: "ІНСТИТУТ ІНФОРМАЦІЙНИХ ТЕХНОЛОГІЙ ТА БІЗНЕСУ",
  aboutParagraphs: [
    "Майбутнє належить тим, хто вміє керувати організацією та ефективно просувати ідеї на ринку. У світі, де конкуренція та інновації визначають успіх, ми навчаємо стратегічного управління, маркетингового аналізу та розвитку бізнес-проєктів.",
    "Стань лідером, який формує майбутнє бізнесу!",
  ],
  aboutImage: {
    src: "/images/Departments/dmm-hero.jpg",
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

export const MMHeroWithAbout = (): JSX.Element => {
  return <HeroWithAbout data={heroWithAboutData} />;
};
