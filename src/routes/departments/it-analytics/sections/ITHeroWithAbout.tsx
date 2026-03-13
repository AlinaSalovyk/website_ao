import type { JSX } from "react";
import { HeroWithAbout } from "@/components/sections/HeroWithAbout";
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";

const heroWithAboutData: HeroWithAboutData = {
  heroTitle: "Кафедра інформаційних технологій та аналітики даних",
  heroDescription:
    "Кафедра інформаційних технологій та аналітики даних — це місце, де традиції поєднуються з інноваціями, а знання стають основою для успішної кар'єри у цифрову епоху.",
  cta: {
    label: "Дізнатися більше",
    href: "#general-info",
  },
  sectionId: "about",
  breadcrumbLabel: "ІНСТИТУТ ІНФОРМАЦІЙНИХ ТЕХНОЛОГІЙ ТА БІЗНЕСУ",
  aboutParagraphs: [
    "Майбутнє належить тим, хто вміє працювати з даними. У світі, де інформація — це сила, ми навчаємо перетворювати її на рішення, що змінюють реальність.",
    "Долучайся до тих, хто створює цифрове завтра вже сьогодні!",
  ],
  aboutImage: {
    src: "/images/IT/pexels-thisisengineer.jpg",
    alt: "Students working",
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

export const ITHeroWithAbout = (): JSX.Element => {
  return <HeroWithAbout data={heroWithAboutData} />;
};
