import React, { useState } from 'react';
import type { JSX } from "react";
import { cn } from "@/lib/utils";

interface EducationItem {
    id: string;
    title: string;
    points: string[];
}

const educationData: EducationItem[] = [
    {
        id: "01",
        title: "Освітній підхід",
        points: [
            "Актуальні знання, адаптовані до сучасного ринку.",
            "Практичне спрямування освітніх компонентів.",
            "Опанування сучасних інформаційних технологій.",
            "Комплексне засвоєння англійської мови для вільного спілкування і професійних задач."
        ]
    },
    {
        id: "02",
        title: "Технологічна підготовка",
        points: [
            "Оволодіння Soft Skills.",
            "Проєктування, розробка та тестування інформаційних систем.",
            "Інтенсивне вивчення англійської (рівень B2).",
            "Дослідницька та інноваційна діяльність."
        ]
    },
    {
        id: "03",
        title: "Сучасна інфраструктура",
        points: [
            "Інтерактивні аудиторії з мультимедійним обладнанням.",
            "Комп'ютерні класи, лабораторії, коворкінг-центри.",
            "Кімната психологічного розвантаження, Wi-Fi."
        ]
    },
    {
        id: "04",
        title: "Додаткові можливості",
        points: [
            "Вивчення іноземних мов, адаптованих до спеціальності.",
            "Онлайн навчання (Moodle, Google Meet, Zoom, електронні платформи Office 365, Trello, Jamboard).",
            "Правова підтримка від юристів і консультантів.",
            "Тьюторська та психологічна підтримка.",
            "Наукові дослідження та публікації."
        ]
    },
    {
        id: "05",
        title: "Додаткові переваги",
        points: [
            "Аспірантура зі спеціальності «Менеджмент» та «Прикладна математика».",
            "Участь у міжнародних програмах, навчання за кордоном.",
            "Поєднання зразків навчання (дуальна освіта).",
            "Сертифікатні програми та спеціалізовані тренінги.",
            "Комфортні умови проживання та насичене студентське життя."
        ]
    }
];

export const Education = (): JSX.Element => {
    const [openItems, setOpenItems] = useState<string[]>(["01"]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <section
            className="w-full py-24 text-white"
            style={{
                background: 'linear-gradient(to bottom, #00113B 0%, #000411 100%)'
            }}
        >
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-16 lg:gap-24">

                    {/* Title Section */}
                    <div>
                        <h2 className="font-['Roboto',sans-serif] font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white">
                            Навчання в<br />Інституті IT<br />та бізнесу
                        </h2>
                    </div>

                    {/* Accordion List */}
                    <div className="flex flex-col">
                        {educationData.map((item) => (
                            <div key={item.id} className="border-b border-white/20 last:border-0">
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full flex items-center justify-between py-8 group text-left cursor-pointer"
                                >
                                    <div className="flex items-start gap-1 md:gap-2">
                                        <span className="font-['Roboto',sans-serif] text-sm md:text-base font-medium text-[#0E53FF] mt-1">
                                            {item.id}
                                        </span>
                                        <span className="text-xl md:text-2xl font-['Roboto',sans-serif] font-medium transition-colors group-hover:text-blue-400 text-left">
                                            {item.title}
                                        </span>
                                    </div>
                                    <div className="relative flex items-center justify-center w-6 h-6">
                                        {/* Horizontal line (always visible) */}
                                        <div className="absolute w-6 h-[1px] bg-white transition-transform duration-300" />
                                        {/* Vertical line (rotates to horizontal when open) */}
                                        <div
                                            className={cn(
                                                "absolute w-6 h-[1px] bg-white transition-transform duration-300",
                                                openItems.includes(item.id) ? "rotate-0" : "-rotate-90"
                                            )}
                                        />
                                    </div>
                                </button>

                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openItems.includes(item.id) ? "max-h-[500px] opacity-100 pb-8" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <ul className="pl-12 md:pl-10 space-y-3">
                                        {item.points.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 opacity-80" />
                                                <span className="text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                                                    {point}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
