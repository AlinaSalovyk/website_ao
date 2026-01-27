import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const educationalPrograms = [
    {
        title: "Бакалаврат",
        description: `Перелік спеціальностей
  D2 «Фінанси, банківська справа, страхування та фондовий ринок» (ОПП «Фінанси та бізнес-аналітика»)
  D5 «Маркетинг» (ОПП «DATA-маркетинг та аналітика»)
  D7 «Торгівля» (ОПП «Підприємництво та торгівля»)
  F3 «Комп'ютерні науки» (ОПП «Комп'ютерні науки»)
  F3 «Комп'ютерні науки» (ОПП «Робототехніка та машинне навчання»)
  F3 «Комп'ютерні науки» (ОПП «Штучний інтелект та аналітика даних»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo.png",
    },
    {
        title: "Магістратура",
        description: `Перелік спеціальностей
D1 «Облік і оподаткування» (ОПП «Облік і оподаткування»)
D2 «Фінанси, банківська справа та страхування» (ОПП «Фінанси та бізнес-аналітика»)
D3 «Менеджмент» (ОПП «Менеджмент продажів та логістика») 
D3 «Менеджмент» (ОПП «HR-менеджмент») 
F3 «Комп'ютерні науки» (ОПП «Управління проєктами»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo-1.png",
    },
    {
        title: "Аспірантура",
        description: `Перелік спеціальностей
D3 «Менеджмент» (ОНП «Менеджмент») 
F1 «Прикладна математика» (ОНП «Прикладна математика»)`,
        image: "https://c.animaapp.com/mkvpx7lhh8vezq/img/photo-2.png",
    },
];

export const InnovationStatsSection = (): JSX.Element => {
    return (
        <section className="w-full items-center justify-center px-0 py-20 bg-white flex flex-col">
            <div className="w-full max-w-[1440px] px-9">
                <header className="flex flex-col items-end mb-[118px] translate-y-[-1rem] animate-fade-in opacity-0">
                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[80px] text-right tracking-[0] leading-[80px] whitespace-nowrap">
                        Освітні програми
                    </h2>
                </header>

                <div className="flex flex-col gap-0">
                    {educationalPrograms.map((program, index) => (
                        <div key={index}>
                            <Card
                                className="border-0 shadow-none rounded-none translate-y-[-1rem] animate-fade-in opacity-0"
                                style={
                                    {
                                        "--animation-delay": `${(index + 1) * 200}ms`,
                                    } as React.CSSProperties
                                }
                            >
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-[456px_1fr_340px] gap-0 pt-8">
                                        <div className="flex flex-col items-start pr-16 pb-16">
                                            <h3 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[32px] tracking-[0] leading-[38px] whitespace-nowrap">
                                                {program.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-col items-start justify-between pr-16 pb-16">
                                            <div className="flex flex-col items-start w-full">
                                                <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-base tracking-[0] leading-5 whitespace-pre-line">
                                                    {program.description}
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 hover:bg-transparent group mt-8"
                                            >
                                                <div className="flex flex-col items-start gap-[3px] w-[229px]">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-xs tracking-[0] leading-4 group-hover:[font-family:'Atyp_Text-Medium',Helvetica] group-hover:font-medium transition-[font-family,font-weight]">
                                                            Дізнатися більше
                                                        </span>
                                                        <ArrowRightIcon className="w-[19px] h-3" />
                                                    </div>
                                                    <Separator className="w-full h-px bg-black" />
                                                </div>
                                            </Button>
                                        </div>

                                        <div className="flex items-start pb-16">
                                            <img
                                                className="w-full max-w-[340px] h-[400px] rounded-lg object-cover"
                                                alt={program.title}
                                                src={program.image}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Separator className="w-full h-px bg-[#0f1215]" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
