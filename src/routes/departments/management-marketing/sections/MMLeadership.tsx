import type { JSX } from "react";

import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const memberImages = [
  "/images/InstituteManagement/Kozak.webp",
  "/images/InstituteManagement/fominyh.webp",
];

export const MMLeadership = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const leadershipData: LeadershipData = {
    title: t.departmentPages.common.departmentLeadership,
    members: t.departmentPages.mm.leadership.map((member, index) => ({
      ...member,
      id: index + 1,
      image: memberImages[index],
    })),
  };

  return <Leadership data={leadershipData} />;
};
