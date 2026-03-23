import type { JSX } from "react";

import { ScientificActivity } from "@/components/sections/ScientificActivity";
import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const ITScientificActivity = ({
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
    description: t.departmentPages.it.science.text,
  };

  return <ScientificActivity data={scientificActivityData} />;
};
