import type { JSX } from "react";

import { EducationalPrograms } from "@/components/sections/EducationalPrograms";
import type { EducationalProgramsData } from "@/components/sections/educational-programs.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const ITEducationalPrograms = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const educationalProgramsData: EducationalProgramsData = {
    sectionId: "general-info",
    title: t.departmentPages.common.generalInfoAbout,
    image: {
      src: "/images/IT/information.webp",
      alt: t.departmentPages.it.info.imageAlt,
    },
    introText: t.departmentPages.it.info.introText,
    columns: [...t.departmentPages.it.info.columns],
  };

  return <EducationalPrograms data={educationalProgramsData} />;
};
