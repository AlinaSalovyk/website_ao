import type { JSX } from "react";

import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const MEMBER_IMAGES = [
  "/images/IT/kryvytska.webp",
  "/images/IT/poruchnyk.webp",
];

export const ITLeadership = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const leadershipData: LeadershipData = {
    title: t.departmentPages.common.departmentLeadership,
    members: t.departmentPages.it.leadership.map((member, index) => ({
      ...member,
      id: index + 1,
      image: MEMBER_IMAGES[index],
    })),
  };

  return <Leadership data={leadershipData} />;
};
