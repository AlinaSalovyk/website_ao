import type { JSX } from "react";

import { EducationalPrograms } from "@/components/sections/EducationalPrograms";
import type { EducationalProgramsData } from "@/components/sections/educational-programs.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const MICEducationalPrograms = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const educationalProgramsData: EducationalProgramsData = {
    sectionId: "general-info",
    title: t.departmentPages.common.generalInfoAbout,
    image: {
      src: "/images/Departments/dfb-info.webp",
      alt: t.departmentPages.mic.info.imageAlt,
    },
    introText: t.departmentPages.mic.info.introText,
    columns: [...t.departmentPages.mic.info.columns],
  };

  return <EducationalPrograms data={educationalProgramsData} />;
};
