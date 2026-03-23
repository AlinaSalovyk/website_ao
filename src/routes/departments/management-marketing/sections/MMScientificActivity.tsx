import type { JSX } from "react";

import { ScientificActivity } from "@/components/sections/ScientificActivity";
import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const MMScientificActivity = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const scientificActivityData: ScientificActivityData = {
    title: t.departmentPages.common.scientificActivity,
    headingVariant: "compact",
    contentSpacing: "my",
    image: {
      src: "/images/logo-compact.webp",
      alt: t.departmentPages.common.scientificActivityAlt,
      width: 684,
      height: 672,
    },
    description: (
      <>
        {t.departmentPages.mm.science.text}{" "}
        <a
          href="https://ecj.oa.edu.ua/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-leadership-link transition-colors"
        >
          {t.departmentPages.mm.science.linkText}
        </a>
      </>
    ),
  };

  return <ScientificActivity data={scientificActivityData} />;
};
