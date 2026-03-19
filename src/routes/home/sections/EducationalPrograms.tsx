import type { JSX } from "react";
import React from "react";
import { ArrowRight } from "lucide-react";
import { partnerLogos } from "@/components/icons/PartnerLogos";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

interface Specialty {
    name: string;
    link?: string;
}

interface EducationalProgram {
    title: string;
    specialties: Specialty[];
    image: string;
}

const educationalPrograms: EducationalProgram[] = [
    {
        title: "Бакалаврат",
        specialties: [
            { name: "F3 «Комп'ютерні науки» (ОПП «Комп'ютерні науки»)", link: "https://vstup.oa.edu.ua/specialnosti/kompyuterni-nauki" },
            { name: "F3 «Комп'ютерні науки» (ОПП «Програмування роботизованих систем» (Робототехніка))", link: "https://vstup.oa.edu.ua/specialnosti/robotics_and_machine_learning" },
            { name: "D2 «Фінанси, банківська справа, страхування та фондовий ринок» (ОПП «Фінанси та бізнес-аналітика»)", link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya" },
            { name: "D3 «Менеджмент» (ОПП «Підприємництво та управління бізнесом»)", link: "https://vstup.oa.edu.ua/specialnosti/business_and_trade" },
            { name: "D5 «Маркетинг» (ОПП «DATA-маркетинг та аналітика»)", link: "https://vstup.oa.edu.ua/specialnosti/data-marketing-ta-analitika" },
        ],
        image: "/images/EducationalPrograms/BachelorsDegree.webp",
    },
    {
        title: "Магістратура",
        specialties: [
            { name: "F3 «Комп'ютерні науки» (ОПП «Управління IT-проєктами»)", link: "https://vstup.oa.edu.ua/specialnosti/upravlinnya-proektami" },
            { name: "D2 «Фінанси, банківська справа та страхування» (ОПП «Фінанси та бізнес-аналітика»)", link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya" },
            { name: "D3 «Менеджмент» (ОПП «Менеджмент продажів та логістика»)", link: "https://vstup.oa.edu.ua/specialnosti/menedzhment-prodazhiv-ta-logistika" },
            { name: "D3 «Менеджмент» (ОПП «HR-менеджмент»)", link: "https://vstup.oa.edu.ua/specialnosti/hr-menedzhment" },
            { name: "D1 «Облік і оподаткування» (ОПП «Облік і оподаткування»)", link: "https://vstup.oa.edu.ua/specialnosti/oblik-i-opodatkuvannya" },
        ],
        image: "/images/EducationalPrograms/Magistracy.webp",
    },
    {
        title: "Аспірантура",
        specialties: [
            { name: "F1 «Прикладна математика» (ОНП «Прикладна математика»)", link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/" },
            { name: "D3 «Менеджмент» (ОНП «Менеджмент»)", link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/d3_menedzhment/" },
        ],
        image: "/images/EducationalPrograms/PostgraduateStudies.webp",
    },
];


export const EducationalPrograms = (): JSX.Element => {
    return (
        <section id="educational-programs" className="w-full items-center justify-center px-0 py-20 bg-pure-white flex flex-col overflow-hidden">
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 flex flex-col lg:items-center">
                <ScrollReveal variant="fade-up">
                    <header className="flex flex-col items-center mb-16 lg:mb-24 w-full text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Напрямки підготовки
                        </div>
                        <h2 className="font-semibold text-pure-black text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] w-full max-w-3xl">
                            Спеціальності та освітні програми
                        </h2>
                    </header>
                </ScrollReveal>

                <div className="flex flex-col gap-20 lg:gap-32 w-full">
                    {educationalPrograms.map((program, index) => {
                        const isEven = index % 2 === 0;
                        const id = program.title === "Бакалаврат" ? "bachelor" : program.title === "Магістратура" ? "master" : "postgraduate";

                        return (
                            <ScrollReveal key={index} variant="fade-up" delay={100} className="w-full">
                                <div id={id} className="flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-20 items-center lg:items-center w-full">
                                    {/* Image Column - Styled as a framed UI element to hide low resolution */}
                                    <div className={`w-full max-w-[280px] lg:max-w-none lg:w-4/12 xl:w-3/12 mx-auto ${!isEven ? 'lg:order-2' : ''}`}>
                                        <div className="w-full aspect-square rounded-[2rem] shadow-sm bg-gray-50 flex items-center justify-center relative border border-gray-100/50 p-3 lg:p-4">
                                            <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden shadow-sm relative">
                                                <img
                                                    src={program.image}
                                                    alt={program.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 hover:opacity-90"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Column */}
                                    <div className={`w-full lg:w-8/12 xl:w-9/12 flex flex-col justify-center ${!isEven ? 'lg:order-1' : ''}`}>
                                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 lg:mb-10 text-pure-black tracking-tight">
                                            {program.title}
                                        </h3>
                                        <div className="flex flex-col border-t border-gray-200 w-full">
                                            {program.specialties.map((specialty, idx) => {
                                                const Wrapper = specialty.link ? 'a' : 'div';
                                                return (
                                                    <Wrapper
                                                        key={idx}
                                                        href={specialty.link}
                                                        target={specialty.link ? "_blank" : undefined}
                                                        rel={specialty.link ? "noopener noreferrer" : undefined}
                                                        className="group flex items-center justify-between py-5 md:py-6 border-b border-gray-200 hover:border-blue-600 transition-colors cursor-pointer"
                                                    >
                                                        <span className="text-pure-black text-sm md:text-base xl:text-lg font-medium leading-relaxed pr-6 group-hover:text-blue-600 transition-colors">
                                                            {specialty.name}
                                                        </span>
                                                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all shrink-0" />
                                                    </Wrapper>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </div>

            {/* Marquee Animation Section — preserved */}
            <div className="w-full overflow-hidden mt-24 py-12 bg-pure-white border-t border-gray-100">
                <div className="flex items-center gap-16 animate-marquee-seamless">
                    {[...Array(6)].map((_, setIndex) => (
                        <React.Fragment key={setIndex}>
                            {partnerLogos}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
};
