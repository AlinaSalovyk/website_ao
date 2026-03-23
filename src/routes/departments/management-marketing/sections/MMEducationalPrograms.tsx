import type { JSX } from "react";

import { EducationalPrograms } from "@/components/sections/EducationalPrograms";
import type { EducationalProgramsData } from "@/components/sections/educational-programs.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const MMEducationalPrograms = ({
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
      alt: t.departmentPages.mm.info.imageAlt,
    },
    introText: t.departmentPages.mm.info.introText,
    columns: [...t.departmentPages.mm.info.columns],
  };

  return <EducationalPrograms data={educationalProgramsData} />;
};
