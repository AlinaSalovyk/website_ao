import React, { useState } from 'react';
import type { JSX } from "react";
import { cn } from "@/lib/utils";

interface ScientificItem {
    id: string;
    title: string;
    content: React.ReactNode;
}

const scientificData: ScientificItem[] = [
    {
        id: "01",
        title: "Напрями наукових досліджень",
        content: (
            <ul className="space-y-4">
                <li className="text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                    <strong className="text-white block mb-1">1. Кафедра фінансів та бізнесу</strong>
                    «Забезпечення сталого розвитку фінансової системи України в умовах глобалізації», номер державної реєстрації 0122U000732, науковий керівник — кандидат економічних наук, доцент Шершньова О. В.
                </li>
                <li className="text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                    <strong className="text-white block mb-1">2. Кафедра менеджменту та маркетингу</strong>
                    «Теоретико-методологічні та практичні аспекти формування механізмів управління підприємствами та організаціями», номер державної реєстрації 0122U000741, науковий керівник — доктор економічних наук, доцент Козак Л. В.
                </li>
                <li className="text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                    <strong className="text-white block mb-1">3. Кафедра інформаційних технологій та аналітики даних</strong>
                    «Моделювання та комп'ютерне моделювання природничих, технічних та економічних процесів та розробка інформаційних систем», номер державної реєстрації 0121U108333, науковий керівник — доктор фізико-математичних наук, доцент Глюз О. А.
                </li>
            </ul>
        )
    },
    {
        id: "02",
        title: "Наукові фахові видання",
        content: (
            <div className="space-y-4 text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                <p>
                    Науковий вісник Національного університету «Острозька академія» серія «Економіка».
                </p>
                <p>
                    Видання входить до «Переліку наукових фахових видань, в яких можуть публікуватися результати дисертаційних робіт на здобуття наукових ступенів доктора і кандидата наук» (категорія «Б», Наказ МОН України № 409 від 17 березня 2020 р.
                </p>
                <p>
                    Журнал індексується в Міжнародному центрі періодичних видань (ISSN International Centre, Paris, France): ISSN 2311-5149 (Print/Online). Журнал входить до «Переліку наукових фахових видань, в яких можуть публікуватися результати дисертаційних робіт на здобуття наукових ступенів доктора і кандидата наук» (категорія «Б», Наказ МОН України № 1643 від 28.12.2019).
                </p>
                <p>
                    Журнал долучено до міжнародних наукометричних баз і каталогів наукових видань: INDEX COPERNICUS (ICV 2017 = 74.48); EBSCO Publishing, Inc.; ResearchBib; Ulrich's Periodicals Directory; ERIH PLUS; Google Scholar; Національна бібліотека України імені В. І. Вернадського; Бібліометрика української науки; Українська науково-освітня телекомунікаційна мережа УРАН.
                </p>
            </div>
        )
    },
    {
        id: "03",
        title: "Наукові конференції",
        content: (
            <ul className="space-y-2 text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed list-decimal pl-5">
                <li>
                    Щорічна міжнародна науково-практична інтернет-конференція «Фінансова система країни: тенденції та перспективи розвитку».
                </li>
                <li>
                    Щорічна всеукраїнська науково-практична інтернет-конференція молодих учених та студентів «Проблеми та перспективи розвитку національної економіки в умовах глобалізації».
                </li>
            </ul>
        )
    }
];

export const ScientificActivity = (): JSX.Element => {
    const [openItems, setOpenItems] = useState<string[]>(["01"]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <section className="w-full bg-[#00113B] py-24 text-white">
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-16 lg:gap-24">

                    {/* Title Section */}
                    <div>
                        <h2 className="font-['Roboto',sans-serif] font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white">
                            Наукова активність
                        </h2>
                    </div>

                    {/* Accordion List */}
                    <div className="flex flex-col">
                        {scientificData.map((item) => (
                            <div key={item.id} className="border-b border-white/20 last:border-0">
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full flex items-center justify-between py-6 group text-left"
                                >
                                    <div className="flex items-start gap-1 md:gap-2">
                                        <span className="font-['Roboto',sans-serif] text-sm md:text-base font-medium text-blue-500/30 mt-1">
                                            {item.id}
                                        </span>
                                        <span className="text-lg md:text-xl font-['Roboto',sans-serif] font-medium transition-colors group-hover:text-blue-400 text-left">
                                            {item.title}
                                        </span>
                                    </div>
                                    <div className="relative flex items-center justify-center w-6 h-6">
                                        <div className="absolute w-4 h-[1px] bg-white transition-transform duration-300" />
                                        <div
                                            className={cn(
                                                "absolute w-4 h-[1px] bg-white transition-transform duration-300",
                                                openItems.includes(item.id) ? "rotate-0" : "-rotate-90"
                                            )}
                                        />
                                    </div>
                                </button>

                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openItems.includes(item.id) ? "max-h-[800px] opacity-100 pb-8" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="pl-12 md:pl-10">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
