import type { JSX } from "react";

import { HeroWithAbout } from "@/components/sections/HeroWithAbout";
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const MMHeroWithAbout = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const heroWithAboutData: HeroWithAboutData = {
    heroTitle: t.departmentPages.mm.hero.title,
    heroDescription: t.departmentPages.mm.hero.description,
    cta: {
      label: t.departmentPages.common.learnMore,
      href: "#general-info",
    },
    sectionId: "about",
    breadcrumbLabel: t.departmentPages.common.breadcrumbLabel,
    aboutParagraphs: [...t.departmentPages.mm.hero.aboutParagraphs],
    aboutImage: {
      src: "/images/Departments/dmm-hero.webp",
      alt: t.departmentPages.common.studentsWorking,
      width: 4096,
      height: 2732,
    },
    backgroundShapeImage: {
      src: "/images/IT/3D Black Chrome Shape1.webp",
      alt: t.departmentPages.common.elementAlt,
      width: 1426,
      height: 1456,
    },
    backgroundShapeFilter: "hue-rotate(-50deg) brightness(1.0) saturate(9.0)",
  };

  return <HeroWithAbout data={heroWithAboutData} locale={locale} />;
};
