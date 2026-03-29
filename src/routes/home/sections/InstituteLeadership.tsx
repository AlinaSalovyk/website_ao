import {
  TeamShowcase,
  type TeamMember,
} from "@/components/sections/TeamShowcase";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const MEMBER_IMAGES = [
  "/images/InstituteManagement/novoseletskyy.webp",
  "/images/InstituteManagement/shulyk.webp",
  "/images/InstituteManagement/cherniavskyi.webp",
  "/images/InstituteManagement/Kozak.webp",
  "/images/InstituteManagement/novak.webp",
  "/images/InstituteManagement/haletska.webp",
];

const MEMBER_EMAILS = [
  "oleksandr.novoseletskyi@oa.edu.ua",
  "yulia.shulyk@oa.edu.ua",
  "andrii.cherniavskyi@oa.edu.ua",
  "lyudmyla.kozak@oa.edu.ua",
  "anna.novak@oa.edu.ua",
  "dekanat.ekonomichnyi@oa.edu.ua",
];

export const InstituteLeadership = ({ locale }: { locale?: Locale }) => {
  const t = getTranslations(locale);

  const leadershipData: TeamMember[] = t.instituteLeadership.map((m, i) => ({
    id: i + 1,
    name: m.name,
    role: m.role,
    email: MEMBER_EMAILS[i],
    image: MEMBER_IMAGES[i],
  }));
  return (
    <TeamShowcase
      members={leadershipData}
      badge={t.home.leadership.badge}
      heading={t.home.leadership.heading}
      sectionId="leadership"
      locale={locale}
    />
  );
};
