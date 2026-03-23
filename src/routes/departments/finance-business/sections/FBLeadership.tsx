import type { JSX } from "react";

import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const memberImages = [
  "/images/InstituteManagement/shulyk.webp",
  "/images/InstituteManagement/hontar.webp",
];

export const FBLeadership = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const leadershipData: LeadershipData = {
    title: t.departmentPages.common.departmentLeadership,
    members: t.departmentPages.fb.leadership.map((m, i) => ({
      id: i + 1,
      name: m.name,
      role: m.role,
      email: m.email,
      officeHours: m.officeHours,
      image: memberImages[i],
    })),
  };

  return <Leadership data={leadershipData} />;
};
