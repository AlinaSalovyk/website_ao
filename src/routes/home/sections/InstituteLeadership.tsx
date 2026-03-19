import { TeamShowcase, type TeamMember, type TeamMemberSocial } from "@/components/sections/TeamShowcase";
import { FacebookIcon } from "@/components/icons/social/FacebookIcon";
import { InstagramIcon } from "@/components/icons/social/InstagramIcon";
import { LinkedInIcon } from "@/components/icons/social/LinkedInIcon";

const defaultSocials: TeamMemberSocial[] = [
    {
        icon: <FacebookIcon iconSize="w-10 h-10 md:w-14 md:h-14" iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors" borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors" />,
        href: "#",
        label: "Facebook",
    },
    {
        icon: <InstagramIcon iconSize="w-10 h-10 md:w-14 md:h-14" iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors" borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors" />,
        href: "#",
        label: "Instagram",
    },
    {
        icon: <LinkedInIcon iconSize="w-10 h-10 md:w-14 md:h-14" iconColor="fill-blue-600 group-hover/social:fill-blue-700 transition-colors" borderColor="fill-blue-100 group-hover/social:fill-blue-200 transition-colors" />,
        href: "#",
        label: "LinkedIn",
    },
];

const leadershipData: TeamMember[] = [
    {
        id: 1,
        name: "Новоселецький Олександр Миколайович",
        role: "Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент кафедри інформаційних технологій та аналітики даних",
        email: "oleksandr.novoseletskyi@oa.edu.ua",
        image: "/images/InstituteManagement/novoseletskyy.jpg",
    },
    {
        id: 2,
        name: "Шулик Юлія Віталіївна",
        role: "Заступник директора з навчально-наукової роботи, кандидат економічних наук, доцент, завідувач кафедри фінансів та бізнесу",
        email: "yulia.shulyk@oa.edu.ua",
        image: "/images/InstituteManagement/shulyk.jpg",
    },
    {
        id: 3,
        name: "Чернявський Андрій Володимирович",
        role: "Заступник директора з навчально-виховної роботи, викладач кафедри інформаційних технологій та аналітики даних",
        email: "andrii.cherniavskyi@oa.edu.ua",
        image: "/images/InstituteManagement/cherniavskyi.jpg",
    },
    {
        id: 4,
        name: "Козак Людмила Василівна",
        role: "Заступник директора з питань якості освіти, доктор економічних наук, доцент кафедри менеджменту та маркетингу",
        email: "lyudmyla.kozak@oa.edu.ua",
        image: "/images/InstituteManagement/Kozak.jpg",
    },
    {
        id: 5,
        name: "Новак Анна Федорівна",
        role: "Заступник директора з профорієнтаційної роботи, викладач кафедри фінансів та бізнесу",
        email: "anna.novak@oa.edu.ua",
        image: "/images/InstituteManagement/novak.jpg",
    },
    {
        id: 6,
        name: "Галецька Тамара Володимирівна",
        role: "Старший лаборант",
        email: "dekanat.ekonomichnyi@oa.edu.ua",
        image: "/images/InstituteManagement/haletska.jpg",
    },
];

export const InstituteLeadership = () => {
    return (
        <TeamShowcase
            members={leadershipData}
            defaultSocials={defaultSocials}
            badge="Наша команда"
            heading="Керівництво інституту"
            sectionId="leadership"
        />
    );
};