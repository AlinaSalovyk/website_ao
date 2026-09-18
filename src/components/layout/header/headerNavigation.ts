import { Info, GraduationCap, Building2, Newspaper } from "lucide-react";
import type { Locale, Translations } from "@/i18n";
import { getLocalizedPath } from "@/i18n";

export interface NavSubItem {
  label: string;
  desc?: string;
  href: string;
  hash?: string;
}

export interface NavDropdownItem {
  id: string;
  label: string;
  mainHref: string;
  hash?: string;
  icon: typeof Info;
  items: NavSubItem[];
}

export function getHeaderNavigation(t: Translations, locale: Locale): NavDropdownItem[] {
  return [
    {
      id: "about",
      label: t.nav.aboutInstitute,
      mainHref: getLocalizedPath("/institute", locale),
      icon: Info,
      items: [
        {
          label: t.nav.aboutInstitute,
          desc: locale === "en" ? "General overview & mission" : "Загальна інформація та місія",
          href: getLocalizedPath("/institute", locale),
        },
        {
          label: t.nav.studentLife,
          desc: locale === "en" ? "Student self-governance & activities" : "Самоврядування та дозвілля",
          href: `${getLocalizedPath("/institute", locale)}#student-life`,
          hash: "#student-life",
        },
        {
          label: t.nav.scientificActivity,
          desc: locale === "en" ? "Research projects & publications" : "Дослідження та проекти",
          href: `${getLocalizedPath("/institute", locale)}#scientific-activity`,
          hash: "#scientific-activity",
        },
        {
          label: t.nav.leadership,
          desc: locale === "en" ? "Institute administration" : "Адміністрація інституту",
          href: `${getLocalizedPath("/", locale)}#leadership`,
          hash: "#leadership",
        },
      ],
    },
    {
      id: "education",
      label: t.nav.educationalPrograms,
      mainHref: `${getLocalizedPath("/", locale)}#educational-programs`,
      hash: "#educational-programs",
      icon: GraduationCap,
      items: [
        {
          label: locale === "en" ? "All Specialties" : "Усі спеціальності",
          desc: t.home.educationalPrograms.heading,
          href: `${getLocalizedPath("/", locale)}#educational-programs`,
          hash: "#educational-programs",
        },
        {
          label: t.educationLevels.bachelor,
          desc: t.educationLevels.bachelorDesc,
          href: `${getLocalizedPath("/", locale)}#bachelor`,
          hash: "#bachelor",
        },
        {
          label: t.educationLevels.master,
          desc: t.educationLevels.masterDesc,
          href: `${getLocalizedPath("/", locale)}#master`,
          hash: "#master",
        },
        {
          label: t.educationLevels.postgraduate,
          desc: t.educationLevels.postgraduateDesc,
          href: `${getLocalizedPath("/", locale)}#postgraduate`,
          hash: "#postgraduate",
        },
      ],
    },
    {
      id: "departments",
      label: locale === "en" ? "Departments & Labs" : "Кафедри та Лабораторії",
      mainHref: `${getLocalizedPath("/", locale)}#departments`,
      hash: "#departments",
      icon: Building2,
      items: [
        {
          label: t.departments.it,
          desc: locale === "en" ? "Software, AI & Data Analytics" : "IT, AI та аналітика даних",
          href: getLocalizedPath("/information-technologies-and-data-analytics", locale),
        },
        {
          label: t.departments.finance,
          desc: locale === "en" ? "Finance, Banking & Tax" : "Фінанси, банківська справа",
          href: getLocalizedPath("/finance-and-business", locale),
        },
        {
          label: t.departments.management,
          desc: locale === "en" ? "Business Management & Marketing" : "Менеджмент та маркетинг",
          href: getLocalizedPath("/management-and-marketing", locale),
        },
        {
          label: t.departments.math,
          desc: locale === "en" ? "Applied Math & Intelligent Computing" : "Прикладна математика",
          href: getLocalizedPath("/mathematics-and-intelligent-computing", locale),
        },
        {
          label: t.laboratories.robotics,
          desc: locale === "en" ? "Embedded AI & Robotics R&D" : "Робототехніка та embedded AI",
          href: getLocalizedPath("/laboratory", locale),
        },
        {
          label: t.laboratories.vr,
          desc: locale === "en" ? "Simulations, VR & Digital Twins" : "VR, AR та цифрові двійники",
          href: getLocalizedPath("/laboratory-vr", locale),
        },
      ],
    },
    {
      id: "news",
      label: t.nav.news,
      mainHref: getLocalizedPath("/news", locale),
      icon: Newspaper,
      items: [],
    },
  ];
}
