"use client";
import type { JSX } from "react";
import { ScrollableCardStack, type DepartmentItem } from "./ScrollableCardStack";

const departments: DepartmentItem[] = [
    {
        id: "finance",
        title: "Кафедра фінансів та бізнесу",
        categories: [
            "БІЗНЕС",
            "ФІНАНСИ",
            "ОБЛІК ТА ОПОДАТКУВАННЯ",
            "ПІДПРИЄМНИЦТВО ТА ТОРГІВЛЯ",
        ],
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-3.svg",
    },
    {
        id: "management",
        title: "Кафедра менеджменту та маркетингу",
        categories: [
            "DATА-МАРКЕТИНГ",
            "АНАЛІТИКА",
            "HR-МЕНЕДЖМЕНТ",
            "МЕНЕДЖМЕНТ ПРОДАЖІВ",
        ],
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-2.svg",
    },
    {
        id: "it",
        title: "Кафедра інформаційних технологій та аналітики даних",
        categories: [
            "РОБОТОТЕХНІКА",
            "ШТУЧНИЙ ІНТЕЛЕКТ",
            "ІТ",
            "ЕКОНОМІЧНА КІБЕРНЕТИКА",
        ],
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-4.svg",
    },
];

export const Departments = (): JSX.Element => {
    return (
        <section className="w-full bg-layout-bg flex flex-col items-center justify-center py-20">
            <div className="flex flex-col w-full max-w-7xl 2xl:max-w-screen-2xl px-9">
                <ScrollableCardStack
                    items={departments}
                    cardHeight={900}
                    perspective={1200}
                    transitionDuration={200}
                />
            </div>
        </section>
    );
};