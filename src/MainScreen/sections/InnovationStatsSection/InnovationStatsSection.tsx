import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const educationalPrograms = [
    {
        title: "Бакалаврат",
        description: `Перелік спеціальностей
• D2 «Фінанси, банківська справа, страхування та фондовий ринок» (ОПП «Фінанси та бізнес-аналітика»)
• D5 «Маркетинг» (ОПП «DATA-маркетинг та аналітика»)
• D7 «Торгівля» (ОПП «Підприємництво та торгівля»)
• F3 «Комп'ютерні науки» (ОПП «Комп'ютерні науки»)
• F3 «Комп'ютерні науки» (ОПП «Робототехніка та машинне навчання»)
• F3 «Комп'ютерні науки» (ОПП «Штучний інтелект та аналітика даних»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo.png",
    },
    {
        title: "Магістратура",
        description: `Перелік спеціальностей
• D1 «Облік і оподаткування» (ОПП «Облік і оподаткування»)
• D2 «Фінанси, банківська справа та страхування» (ОПП «Фінанси та бізнес-аналітика»)
• D3 «Менеджмент» (ОПП «Менеджмент продажів та логістика»)
• D3 «Менеджмент» (ОПП «HR-менеджмент»)
• F3 «Комп'ютерні науки» (ОПП «Управління проєктами»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo-1.png",
    },
    {
        title: "Аспірантура",
        description: `Перелік спеціальностей
• D3 «Менеджмент» (ОНП «Менеджмент»)
• F1 «Прикладна математика» (ОНП «Прикладна математика»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo-2.png",
    },
];

export const InnovationStatsSection = (): JSX.Element => {
    return (
        <section className="w-full items-center justify-center px-0 py-20 bg-white flex flex-col" style={{ backgroundColor: '#ffffff' }}>
            <div className="w-full max-w-[1440px] px-9">
                <header className="flex flex-col items-end mb-16 translate-y-[-1rem] animate-fade-in opacity-0">
                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[#000000] text-[80px] text-right tracking-[0] leading-[80px] whitespace-nowrap">
                        Освітні програми
                    </h2>
                </header>

                <div className="flex flex-col gap-0">
                    {educationalPrograms.map((program, index) => (
                        <div key={index}>
                            {/* Top separator line for each program */}
                            <Separator className="w-full h-px bg-[#000000]" />

                            <Card
                                className="border-0 shadow-none rounded-none bg-white"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <CardContent className="p-0 bg-white" style={{ backgroundColor: '#ffffff' }}>
                                    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_340px] gap-8 py-8">
                                        {/* Title column */}
                                        <div className="flex flex-col items-start">
                                            <h3 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[#000000] text-[28px] tracking-[0] leading-[34px] whitespace-nowrap">
                                                {program.title}
                                            </h3>
                                        </div>

                                        {/* Description and button column */}
                                        <div className="flex flex-col items-start justify-between pr-10">
                                            <div className="flex flex-col items-start w-full">
                                                <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-[#000000] text-sm tracking-[0] leading-6 whitespace-pre-line">
                                                    {program.description}
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 hover:bg-transparent group mt-8"
                                            >
                                                <div className="flex flex-col items-start gap-[3px] w-[180px]">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-[#000000] text-xs tracking-[0] leading-4 group-hover:font-medium transition-all">
                                                            Дізнатися більше
                                                        </span>
                                                        <ArrowRightIcon className="w-4 h-3 text-[#000000]" />
                                                    </div>
                                                    <Separator className="w-full h-px bg-[#000000]" />
                                                </div>
                                            </Button>
                                        </div>

                                        {/* Image column */}
                                        <div className="flex items-start justify-end">
                                            <img
                                                className="w-[340px] h-[400px] rounded-[8px] object-cover"
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
                    <Separator className="w-full h-px bg-[#000000]" />
                </div>
            </div>
        </section>
    );
};
