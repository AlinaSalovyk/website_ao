import type { JSX } from "react";
import { HeroWithAbout } from "@/components/sections/HeroWithAbout";
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";

const heroWithAboutData: HeroWithAboutData = {
  heroTitle: "Кафедра фінансів та бізнесу",
  heroDescription:
    "Кафедра фінансів та бізнесу — це центр підготовки фахівців у сфері фінансів, банківської справи та підприємництва, де теоретичні знання поєднуються з практичним досвідом.",
  cta: {
    label: "Дізнатися більше",
    href: "#general-info",
  },
  sectionId: "about",
  breadcrumbLabel: "ІНСТИТУТ ІНФОРМАЦІЙНИХ ТЕХНОЛОГІЙ ТА БІЗНЕСУ",
  aboutParagraphs: [
    "Майбутнє належить тим, хто вміє управляти фінансами та створювати цінність. У світі, де ресурси визначають можливості, ми навчаємо приймати обґрунтовані фінансові рішення, розвивати бізнес і впевнено діяти в умовах економічних змін.",
    "Долучайся до тих, хто формує фінансову стабільність, розвиває підприємництво та будує успішне економічне завтра!",
  ],
  aboutImage: {
    src: "/images/Departments/dfb-hero.jpg",
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

export const FBHeroWithAbout = (): JSX.Element => {
  return <HeroWithAbout data={heroWithAboutData} />;
};
