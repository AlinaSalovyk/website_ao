import { FacebookIcon } from "@/components/icons/social/FacebookIcon";
import { InstagramIcon } from "@/components/icons/social/InstagramIcon";
import { LinkedInIcon } from "@/components/icons/social/LinkedInIcon";
import {
  TeamShowcase,
  type TeamMember,
  type TeamMemberSocial,
} from "@/components/sections/TeamShowcase";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const defaultSocials: TeamMemberSocial[] = [
  {
    icon: (
      <FacebookIcon
        iconSize="w-10 h-10 md:w-14 md:h-14"
        iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors"
        borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors"
      />
    ),
    href: "#",
    label: "Facebook",
  },
  {
    icon: (
      <InstagramIcon
        iconSize="w-10 h-10 md:w-14 md:h-14"
        iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors"
        borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors"
      />
    ),
    href: "#",
    label: "Instagram",
  },
  {
    icon: (
      <LinkedInIcon
        iconSize="w-10 h-10 md:w-14 md:h-14"
        iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors"
        borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors"
      />
    ),
    href: "#",
    label: "LinkedIn",
  },
];

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
      defaultSocials={defaultSocials}
      badge={t.home.leadership.badge}
      heading={t.home.leadership.heading}
      sectionId="leadership"
      locale={locale}
    />
  );
};
