import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { partnerLogos } from "@/components/icons/PartnerLogos";

const educationalPrograms = [
    {
        title: "Бакалаврат",
        description: `Перелік спеціальностей
- D2 «Фінанси, банківська справа, страхування та фондовий ринок» (ОПП «Фінанси та бізнес-аналітика»)
- D5 «Маркетинг» (ОПП «DATA-маркетинг та аналітика»)
- D7 «Торгівля» (ОПП «Підприємництво та торгівля»)
- F3 «Комп'ютерні науки» (ОПП «Комп'ютерні науки»)
- F3 «Комп'ютерні науки» (ОПП «Робототехніка та машинне навчання»)
- F3 «Комп'ютерні науки» (ОПП «Штучний інтелект та аналітика даних»)`,
        image: "/images/EducationalPrograms/BachelorsDegree.png",
    },
    {
        title: "Магістратура",
        description: `Перелік спеціальностей
- D1 «Облік і оподаткування» (ОПП «Облік і оподаткування»)
- D2 «Фінанси, банківська справа та страхування» (ОПП «Фінанси та бізнес-аналітика»)
- D3 «Менеджмент» (ОПП «Менеджмент продажів та логістика»)
- D3 «Менеджмент» (ОПП «HR-менеджмент»)
- F3 «Комп'ютерні науки» (ОПП «Управління проєктами»)`,
        image: "/images/EducationalPrograms/Magistracy.png",
    },
    {
        title: "Аспірантура",
        description: `Перелік спеціальностей
- D3 «Менеджмент» (ОНП «Менеджмент»)
- F1 «Прикладна математика» (ОНП «Прикладна математика»)`,
        image: "/images/EducationalPrograms/PostgraduateStudies.png",
    },
];


export const EducationalPrograms = (): JSX.Element => {
    return (
        <section className="w-full items-center justify-center px-0 py-20 bg-pure-white flex flex-col">
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-9">
                <header className="flex flex-col items-end mb-16 translate-y-[-1rem] animate-fade-in opacity-0">
                    <h2 className="font-medium text-pure-black text-5xl xl:text-7xl 2xl:text-[80px] text-right tracking-[0] leading-tight xl:leading-[80px] whitespace-nowrap">
                        Освітні програми
                    </h2>
                </header>
                <div className="flex flex-col gap-0">
                    {educationalPrograms.map((program, index) => (
                        <div key={index}>
                            {/* Top separator line for each program */}
                            <Separator className="w-full h-px bg-pure-black" />
                            <Card
                                className="border-0 shadow-none rounded-none bg-pure-white"
                            >
                                <CardContent className="p-0 bg-pure-white">
                                    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_340px] gap-8 py-8">
                                        {/* Title column */}
                                        <div className="flex flex-col items-start">
                                            <h3 className="font-medium text-pure-black text-xl xl:text-2xl 2xl:text-[28px] tracking-[0] leading-snug xl:leading-[34px] whitespace-nowrap">
                                                {program.title}
                                            </h3>
                                        </div>
                                        {/* Description and button column */}
                                        <div className="flex flex-col items-start justify-between pr-10">
                                            <div className="flex flex-col items-start w-full">
                                                <p className="font-normal text-pure-black text-sm tracking-[0] leading-6 whitespace-pre-line">
                                                    {program.description}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 hover:bg-transparent group mt-8"
                                            >
                                                <div className="flex flex-col items-start gap-1 w-36 xl:w-40 2xl:w-[180px]">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-normal text-pure-black text-xs tracking-[0] leading-4 group-hover:font-medium transition-all">
                                                            Дізнатися більше
                                                        </span>
                                                        <ArrowRightIcon className="w-4 h-3 text-pure-black" />
                                                    </div>
                                                    <Separator className="w-full h-px bg-pure-black" />
                                                </div>
                                            </Button>
                                        </div>
                                        {/* Image column */}
                                        <div className="flex items-start justify-end">
                                            <img
                                                className="w-64 xl:w-72 2xl:w-[340px] h-72 xl:h-80 2xl:h-[400px] rounded-lg object-cover"
                                                alt={program.title}
                                                src={program.image}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                    {/* Bottom separator line */}
                    <Separator className="w-full h-px bg-pure-black" />
                </div>
            </div>
            {/* Marquee Animation Section */}
            <div className="w-full overflow-hidden py-12 bg-pure-white">
                <div className="flex items-center gap-16 animate-marquee-seamless">
                    {[...Array(18)].map((_, setIndex) => (
                        <React.Fragment key={setIndex}>
                            {partnerLogos}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
};