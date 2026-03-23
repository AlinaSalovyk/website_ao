import type { JSX } from "react";

import { ScientificActivity } from "@/components/sections/ScientificActivity";
import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const MICScientificActivity = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const scientificActivityData: ScientificActivityData = {
    title: t.departmentPages.common.scientificActivity,
    headingVariant: "compact",
    contentSpacing: "my",
    imageFit: "contain",
    image: {
      src: "/images/Departments/dmc-logo.webp",
      alt: t.departmentPages.common.scientificActivityAlt,
      width: 684,
      height: 672,
    },
    description: (
      <>
        {t.departmentPages.mic.science.text}{" "}
        <a
          href="https://eudemct.oa.edu.ua/uk/holovna/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-leadership-link transition-colors"
        >
          {t.departmentPages.mic.science.linkText}
        </a>{" "}
        <br />
        <br />
        {t.departmentPages.mic.science.extra}
      </>
    ),
  };

  return <ScientificActivity data={scientificActivityData} />;
};
